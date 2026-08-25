import { auth } from '@/lib/chatgpt-handler'

export async function GET(request: Request) { return auth.handler(request) }
export async function POST(request: Request) { return auth.handler(request) }
export async function DELETE(request: Request) { return auth.handler(request) }
