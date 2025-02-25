import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('token')?.value

    const response = await fetch(
      `http://localhost:4000/api/ai/training/${params.id}/status`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include'
      }
    )

    if (!response.ok) {
      throw new Error('Error al obtener el estado del entrenamiento')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error getting training status:', error)
    return NextResponse.json(
      { error: 'Error al obtener el estado del entrenamiento' },
      { status: 500 }
    )
  }
}
