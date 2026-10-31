import { describe, expect, it } from 'vitest'
import { excerpt, since } from './site'

describe('the excerpt of a text', () => {
  it('leaves a text that fits as it is, its spaces collapsed', () => {
    const text = 'O seu desafio será implementar\n um serviço.'

    const cut = excerpt(text, 160)

    expect(cut).toBe('O seu desafio será implementar um serviço.')
  })

  it('cuts a long text at the last whole word within the limit and marks that it goes on', () => {
    const text = 'Cadastrar pontos de interesse, com coordenadas X e Y'

    const cut = excerpt(text, 32)

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
    const ago = since(instant, now)

    expect(ago).toBe(read)
  })

  it('counts the days in São Paulo, where a late night is still the day before', () => {
    const instant = '2026-10-24T02:30:00Z'

    const ago = since(instant, new Date('2026-10-24T09:00:00-03:00'))

    expect(ago).toBe('ontem')
  })
})
