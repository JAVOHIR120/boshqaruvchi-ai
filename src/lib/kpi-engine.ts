import { prisma } from "./prisma";

export async function processDisciplineEvent({
  employeeId,
  type,
  description,
  metadata
}: {
  employeeId: string;
  type: "LATE_ATTENDANCE" | "ON_TIME_ATTENDANCE" | "ABSENT" | "TASK_LATE" | "TASK_COMPLETED";
  description: string;
  metadata?: any;
}) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { user: true, company: true }
  });

  if (!employee) return;

  let kpiChange = 0;
  let addYellow = 0;
  let addRed = 0;
  let alertMessage = "";

  switch (type) {
    case "LATE_ATTENDANCE":
      const minutesLate = metadata?.minutesLate || 0;
      if (minutesLate > 60) {
        kpiChange = -10;
        addYellow = 1;
        alertMessage = `Siz ishga ${minutesLate} daqiqa kechikdingiz. Tizim avtomatik 1 ta SARIQ kartochka yozdi va -10% KPI jarimasi qo'lladi.`;
      } else {
        kpiChange = -3;
        alertMessage = `Siz ishga ${minutesLate} daqiqa kechikdingiz. KPI ko'rsatkichi -3% ga tushirildi. Qoidaga muvofiq har bir kechikish tizim tomonidan qat'iy hisoblanadi.`;
      }
      break;

    case "ON_TIME_ATTENDANCE":
      kpiChange = 1;
      alertMessage = `Rahmat! Bugun ishga o'z vaqtida keldingiz. Disziplina uchun KPI +1% ga oshirildi.`;
      break;

    case "ABSENT":
      kpiChange = -20;
      addRed = 1;
      alertMessage = `Siz ishga sababsiz kelmadingiz. Tizim avtomatik ravishda 1 ta QIZIL kartochka berdi va KPI -20% ga tushirildi.`;
      break;

    case "TASK_LATE":
      kpiChange = -5;
      addYellow = 1;
      alertMessage = `Siz "${metadata?.taskTitle}" vazifasini muddatidan kechikib topshirdingiz. KPI -5% ga tushdi va 1 ta sariq kartochka berildi.`;
      break;

    case "TASK_COMPLETED":
      kpiChange = 5;
      alertMessage = `Ajoyib! Siz "${metadata?.taskTitle}" vazifasini o'z vaqtida, muvaffaqiyatli yakunladingiz. KPI +5% ga oshirildi.`;
      break;
  }

  // Calculate new cards
  let newYellow = employee.yellowCards + addYellow;
  let newRed = employee.redCards + addRed;

  // QO'DA: 3 ta sariq = 1 ta qizil qoidasi (Qat'iy avtomatizatsiya)
  if (newYellow >= 3) {
    const convertedReds = Math.floor(newYellow / 3);
    newRed += convertedReds;
    newYellow = newYellow % 3;
    kpiChange -= (15 * convertedReds); // Qizil kartochka uchun qo'shimcha jarima
    alertMessage += `\n\n⚠️ QAT'IY OGOHLANTIRISH: Sizda 3 ta sariq kartochka yig'ilgani sababli, tizim avtomatik ularni 1 ta QIZIL kartochkaga aylantirdi. Qo'shimcha -15% KPI jarimasi qo'llanildi.`;
  }

  // Calculate new KPI (Min 0, Max 100)
  const newKpi = Math.max(0, Math.min(100, employee.performance + kpiChange));

  // Update Employee Database
  await prisma.employee.update({
    where: { id: employee.id },
    data: {
      performance: newKpi,
      yellowCards: newYellow,
      redCards: newRed
    }
  });

  // Tizim ("AI Boshqaruvchi") nomidan xodimga xabar yuborish (Tasdiq sifatida)
  const boss = await prisma.user.findFirst({
    where: { companyId: employee.companyId, role: { in: ["OWNER", "BOSHLIQ"] } }
  });

  if (boss) {
    await prisma.message.create({
      data: {
        senderId: boss.id,
        recipientId: employee.user.id,
        content: `🤖 AVTOMATIK HR NAZORATI:\n\n${description}\n${alertMessage}\n\n📊 Joriy holatingiz:\n- Samaradorlik (KPI): ${newKpi}%\n- Sariq kartochkalar: ${newYellow} ta\n- Qizil kartochkalar: ${newRed} ta`,
        type: "TEXT"
      }
    });
  }
}
