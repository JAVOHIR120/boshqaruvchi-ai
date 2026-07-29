import { prisma } from "@/lib/prisma";
import LeaderAcademyClient from "./components/LeaderAcademyClient";

export const dynamic = 'force-dynamic';

export default async function LeaderAcademyPage() {
    const videos = await prisma.academyVideo.findMany({
        orderBy: { createdAt: "desc" }
    });

    const books = await prisma.academyBook.findMany({
        orderBy: { createdAt: "desc" }
    });

    return (
        <LeaderAcademyClient videos={videos} books={books} />
    );
}
