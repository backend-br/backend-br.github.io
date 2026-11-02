import { describe, expect, it } from 'vitest'
import { excerpt, since } from './site'

describe('the excerpt of a text', () => {
  it('leaves a text that fits as it is, its spaces collapsed', () => {
    // Given a short text with a line break
    const text = 'O seu desafio será implementar\n um serviço.'

    // When the excerpt is cut
    const cut = excerpt(text, 160)

    // Then the text is whole with its spaces collapsed
    expect(cut).toBe('O seu desafio será implementar um serviço.')
  })

  it('cuts a long text at the last whole word within the limit and marks that it goes on', () => {
    // Given a text longer than the limit
    const text = 'Cadastrar pontos de interesse, com coordenadas X e Y'

    // When the excerpt is cut at 32 characters
    const cut = excerpt(text, 32)

    // Then it ends at a whole word, marked as going on, within the limit
    expect(cut).toBe('Cadastrar pontos de interesse…')
    expect(cut.length).toBeLessThanOrEqual(32)
  })
})

describe('how long ago a day was', () => {
  const now = new Date('2026-10-24T15:00:00-03:00')

  it.each([
    ['2026-10-24T08:00:00-03:00', 'hoje'],
    ['2026-10-23T23:30:00-03:00', 'ontem'],
    ['2026-10-21T10:00:00-03:00', 'há 3 dias'],
    ['2026-10-17T10:00:00-03:00', 'há 1 semana'],
    ['2026-10-03T10:00:00-03:00', 'há 3 semanas'],
    ['2026-09-12T10:00:00-03:00', '12 de set.'],
  ])('reads %s as %j', (instant, read) => {
    // Given an instant before now
    const past = instant

    // When the time since is read
    const ago = since(past, now)

    // Then it is the reading of the row
    expect(ago).toBe(read)
  })

  it('counts the days in São Paulo, where a late night is still the day before', () => {
    // Given an instant that is late night in São Paulo
    const instant = '2026-10-24T02:30:00Z'

    // When the time since is read in the morning of the next day
    const ago = since(instant, new Date('2026-10-24T09:00:00-03:00'))

    // Then it was yesterday
    expect(ago).toBe('ontem')
  })
})
