from pathlib import Path
r=Path(__file__).resolve().parents[1]
s=(r/'src/site/index.html').read_text(encoding='utf-8')
(r/'index.html').write_text(s.replace('href="style.css','href="src/site/style.css').replace('src="','src="src/site/'),encoding='utf-8')
