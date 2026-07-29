import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Load data in memory on server start for fast queries
const dataPath = path.join(process.cwd(), 'src', 'data', 'tax_code.json');
let taxData: any[] = [];

try {
    if (fs.existsSync(dataPath)) {
        const fileContent = fs.readFileSync(dataPath, 'utf-8');
        taxData = JSON.parse(fileContent);
    }
} catch (error) {
    console.error('Error loading tax code data:', error);
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase() || '';
    const part = searchParams.get('qism');
    const section = searchParams.get('bolim');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    let results = taxData;

    // Filter by Part (Qism)
    if (part) {
        results = results.filter(item => item.qism === part);
    }

    // Filter by Section (Bo'lim)
    if (section) {
        results = results.filter(item => item.bolim === section);
    }

    // Text Search
    if (query) {
        results = results.filter(item =>
            (item.title && item.title.toLowerCase().includes(query)) ||
            (item.content && item.content.some((text: string) => text.toLowerCase().includes(query)))
        );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedResults = results.slice(startIndex, startIndex + limit);

    return NextResponse.json({
        total: results.length,
        page,
        totalPages: Math.ceil(results.length / limit),
        data: paginatedResults
    });
}
