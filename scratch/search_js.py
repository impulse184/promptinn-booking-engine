import re

with open('frontend/dist/assets/index-EqHl2hz8.js', 'r', encoding='utf-8') as f:
    content = f.read()

matches = [m.start() for m in re.finditer('listings-grid', content)]
print(f"Found {len(matches)} matches")
for idx, pos in enumerate(matches):
    start = max(0, pos - 100)
    end = min(len(content), pos + 100)
    print(f"Match {idx+1} at position {pos}:")
    print(content[start:end])
    print("-" * 50)
