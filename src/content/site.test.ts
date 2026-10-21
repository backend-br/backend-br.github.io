import { describe, expect, it } from 'vitest'
import { excerpt } from './site'

describe('the excerpt of a text', () => {
  it('leaves a text that fits as it is, its spaces collapsed', () => {
    // Given a short text with a line break inside
    const text = 'O seu desafio será implementar\n um serviço.'

    // When it is cut to the limit
    const cut = excerpt(text, 160)

    // Then it is the same text on one line
    expect(cut).toBe('O seu desafio será implementar um serviço.')
  })

  it('cuts a long text at the last whole word within the limit and marks that it goes on', () => {
    // Given a text longer than the limit, whose last whole word before the limit ends in a comma
    const text = 'Cadastrar pontos de interesse, com coordenadas X e Y'

    // When it is cut to 32 characters
    const cut = excerpt(text, 32)

    // Then it ends on that word, without the comma, followed by an ellipsis, and fits the limit
    expect(cut).toBe('Cadastrar pontos de interesse…')
    expect(cut.length).toBeLessThanOrEqual(32)
  })
})
