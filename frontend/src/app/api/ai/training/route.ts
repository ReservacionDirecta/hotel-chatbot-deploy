import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('token')?.value

    const response = await fetch('http://localhost:4000/api/ai/training', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error('Error al obtener entrenamientos')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error getting trainings:', error)
    return NextResponse.json(
      { error: 'Error al obtener los entrenamientos' },
      { status: 500 }
    )
  }
}
