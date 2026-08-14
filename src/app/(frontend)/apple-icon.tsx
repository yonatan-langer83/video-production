import { ImageResponse } from 'next/og'

import { BRAND_COLOR } from '@/lib/brand'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: BRAND_COLOR,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            background: 'white',
            borderRadius: 12,
          }}
        />
      </div>
    ),
    { ...size },
  )
}
