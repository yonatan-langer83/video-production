import { ImageResponse } from 'next/og'

import { BRAND_COLOR } from '@/lib/brand'

export const alt = 'הפקות וידאו'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: BRAND_COLOR,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            background: 'white',
            borderRadius: 16,
            marginBottom: 32,
          }}
        />
        <div style={{ fontSize: 64, fontWeight: 700 }}>Video Productions</div>
        <div style={{ fontSize: 28, marginTop: 12, opacity: 0.9 }}>הפקות וידאו</div>
      </div>
    ),
    { ...size },
  )
}
