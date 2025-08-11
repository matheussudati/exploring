import React, { useState } from 'react'

interface LoginScreenProps {
  onConnect: (name: string) => void
}

export default function LoginScreen({ onConnect }: LoginScreenProps): React.ReactElement {
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onConnect(name.trim())
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '1rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '400px',
        }}
      >
        <h1
          style={{
            margin: '0 0 1.5rem 0',
            fontSize: '2rem',
            textAlign: 'center',
            color: '#333',
          }}
        >
          Jogo Multiplayer 2D
        </h1>
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="name"
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#666',
              fontSize: '0.9rem',
            }}
          >
            Digite seu nome
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome aqui..."
            autoFocus
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              border: '2px solid #e1e1e1',
              borderRadius: '0.5rem',
              outline: 'none',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#667eea'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e1e1e1'
            }}
          />
        </div>
        <button
          type="submit"
          disabled={!name.trim()}
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '1rem',
            fontWeight: 'bold',
            color: 'white',
            background: name.trim() ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#ccc',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: name.trim() ? 'pointer' : 'not-allowed',
            transition: 'transform 0.2s, opacity 0.2s',
          }}
          onMouseEnter={(e) => {
            if (name.trim()) {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.opacity = '0.9'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.opacity = '1'
          }}
        >
          Conectar
        </button>
      </form>
    </div>
  )
}
