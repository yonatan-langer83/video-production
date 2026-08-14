import { ImageResponse } from 'next/og'

import { BRAND_COLOR } from '@/lib/brand'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
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
            width: 14,
            height: 14,
            background: 'white',
            borderRadius: 2,
          }}
        />
      </div>
    ),
    { ...size },
  )
}
