import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const WORKER_URL = process.env.WORKER_URL;

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    if (!WORKER_URL) {
      return NextResponse.json(
        { error: 'Worker URL not configured' },
        { status: 500 }
      );
    }

    // Fetch user with usage stats from D1
    const response = await fetch(
      `${WORKER_URL}/api/user/get-with-usage?userId=${session.user.id}`,
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch user stats' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: '获取用户统计失败' },
      { status: 500 }
    );
  }
}
