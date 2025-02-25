import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('token')?.value

    const response = await fetch(
      `http://localhost:4000/api/ai/training/${params.id}/start`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include'
      }
    )

    if (!response.ok) {
      throw new Error('Error al iniciar el entrenamiento')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error starting training:', error)
    return NextResponse.json(
      { error: 'Error al iniciar el entrenamiento' },
      { status: 500 }
    )
  }
}
