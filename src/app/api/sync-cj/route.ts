import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

// Track sync process state in memory
let activeSyncProcess: {
  pid?: number;
  startedAt: string;
  status: 'running' | 'completed' | 'failed';
  lastLog?: string;
} | null = null;

export async function GET(request: NextRequest) {
  return handleSync(request);
}

export async function POST(request: NextRequest) {
  return handleSync(request);
}

async function handleSync(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');
  const secret = searchParams.get('secret') || request.headers.get('x-sync-secret');
  const expectedSecret = process.env.SYNC_SECRET || process.env.CRON_SECRET;

  // Optional authentication check if a secret is configured in environment
  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json(
      { error: 'Unauthorized: invalid or missing sync secret' },
      { status: 401 }
    );
  }

  // If checking status only
  if (action === 'status') {
    return NextResponse.json({
      active: activeSyncProcess?.status === 'running',
      syncState: activeSyncProcess || { status: 'idle' },
    });
  }

  // Check if a sync is already running
  if (activeSyncProcess && activeSyncProcess.status === 'running') {
    return NextResponse.json(
      {
        message: 'A CJ synchronization is already in progress.',
        syncState: activeSyncProcess,
      },
      { status: 409 }
    );
  }

  const cid = searchParams.get('cid') || process.env.CJ_COMPANY_ID || '7999396';
  const max = searchParams.get('max') || process.env.CJ_SYNC_MAX || '10000';
  const token = searchParams.get('token') || process.env.CJ_PERSONAL_ACCESS_TOKEN;

  const scriptPath = path.join(process.cwd(), 'scripts', 'fetch-cj-api.js');

  const args = ['--cid', cid, '--max', max];
  if (token) {
    args.push('--token', token);
  }

  console.log(`[API_SYNC_CJ] Spawning asynchronous CJ sync (CID: ${cid}, MAX: ${max})...`);

  // Spawn background child process completely detached from the request loop
  const child = spawn(process.execPath, [scriptPath, ...args], {
    detached: true,
    stdio: 'ignore',
    cwd: process.cwd(),
    env: { ...process.env },
  });

  child.unref();

  activeSyncProcess = {
    pid: child.pid,
    startedAt: new Date().toISOString(),
    status: 'running',
  };

  child.on('exit', (code) => {
    console.log(`[API_SYNC_CJ] Background sync process (PID ${child.pid}) exited with code ${code}`);
    if (activeSyncProcess && activeSyncProcess.pid === child.pid) {
      activeSyncProcess.status = code === 0 ? 'completed' : 'failed';
    }
  });

  // Return 202 Accepted immediately so HTTP connection never blocks or times out
  return NextResponse.json(
    {
      success: true,
      message: 'CJ synchronization triggered asynchronously in background.',
      pid: child.pid,
      startedAt: activeSyncProcess.startedAt,
      cid,
      maxProducts: parseInt(max, 10),
    },
    { status: 202 }
  );
}
