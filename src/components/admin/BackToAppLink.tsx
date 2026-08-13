'use client'

import React from 'react'

export const BackToAppLink: React.FC = () => {
  return (
    <a
      href="/"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        marginBottom: '0.75rem',
        padding: '0.35rem 0.65rem',
        borderRadius: '4px',
        background: 'var(--theme-elevation-100, #f0f0f0)',
        color: 'var(--theme-text, #1a1a1a)',
        textDecoration: 'none',
        fontSize: '0.875rem',
        fontWeight: 500,
      }}
    >
      ← חזרה לאפליקציה / Back to app
    </a>
  )
}
