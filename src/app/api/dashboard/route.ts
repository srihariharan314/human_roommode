import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUserDashboardStats } from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const stats = await getUserDashboardStats(user.id);

    return NextResponse.json({
      success: true,
      user,
      stats,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
