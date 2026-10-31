import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).parent.parent
FONTS = ROOT / 'src' / 'assets' / 'fonts'
PAGE, INK, MUTED, GREEN, YELLOW = '#eef2ef', '#2b2019', '#5b4e43', '#065642', '#fcd166'

CAPYBARA_ROWS = (16, 300)


def font(family: str, size: int, *axes: int) -> ImageFont.FreeTypeFont:
    face = ImageFont.truetype(str(FONTS / f'{family}-latin-variable.woff2'), size)
    face.set_variation_by_axes(list(axes))
    return face


def capybara(logo: Image.Image) -> Image.Image:
    top, bottom = CAPYBARA_ROWS
    animal = logo.crop((0, top, logo.width, bottom))
    animal = animal.crop(animal.getbbox())
    side = max(animal.size) + 8
    square = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    square.alpha_composite(animal, ((side - animal.width) // 2, (side - animal.height) // 2))
    return square


def icon(animal: Image.Image, size: int, radius: int) -> Image.Image:
    tile = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(tile).rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=YELLOW)
    inner = round(size * 0.86)
    tile.alpha_composite(animal.resize((inner, inner), Image.LANCZOS), ((size - inner) // 2, size - inner))
    return tile


def card(logo: Image.Image) -> Image.Image:
    sheet = Image.new('RGBA', (1200, 630), PAGE)
    draw = ImageDraw.Draw(sheet)
    draw.rectangle((0, 0, 1200, 14), fill=GREEN)
    draw.rectangle((0, 616, 1200, 630), fill=YELLOW)
    sheet.alpha_composite(logo.resize((360, 360), Image.LANCZOS), (60, 135))
    draw.text((470, 150), 'Back-End', font=font('bricolage-grotesque', 104, 800), fill=INK)
    draw.text((470, 255), 'Brasil', font=font('bricolage-grotesque', 104, 800), fill=GREEN)
    words = font('ibm-plex-sans', 34, 400)
    draw.text((474, 400), 'Vagas, desafios e projetos open-source', font=words, fill=MUTED)
    draw.text((474, 444), 'da comunidade brasileira de backend.', font=words, fill=MUTED)
    draw.text((474, 520), 'backend-br.github.io', font=font('jetbrains-mono', 28, 600), fill=GREEN)
    return sheet


def main() -> None:
    logo = Image.open(ROOT / 'src' / 'assets' / 'logo.png').convert('RGBA')
    animal = capybara(logo)
    animal.save(ROOT / 'src' / 'assets' / 'capivara.png', optimize=True)
    icon(animal, 64, 14).save(ROOT / 'public' / 'favicon.png', optimize=True)
    icon(animal, 48, 10).save(ROOT / 'public' / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
    icon(animal, 180, 0).convert('RGB').save(ROOT / 'public' / 'apple-touch-icon.png', optimize=True)
    card(logo).convert('RGB').save(ROOT / 'public' / 'og-image.png', optimize=True)


if __name__ == '__main__':
    main()
