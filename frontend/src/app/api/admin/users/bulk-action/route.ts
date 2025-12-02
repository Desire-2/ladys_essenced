import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization');
    
    if (!token) {
      console.error('[Bulk Action API] No authorization token provided');
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 });
    }

    const body = await request.json();
    console.log('[Bulk Action API] Request body:', JSON.stringify(body));
    console.log('[Bulk Action API] Backend URL:', BACKEND_URL);

    const backendUrl = `${BACKEND_URL}/api/admin/users/bulk-action`;
    console.log('[Bulk Action API] Calling backend:', backendUrl);

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('[Bulk Action API] Backend response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Backend error' }));
      console.error('[Bulk Action API] Backend error:', errorData);
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    console.log('[Bulk Action API] Success:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Bulk Action API] Exception:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk action', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
