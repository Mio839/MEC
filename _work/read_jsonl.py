import json, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
path = r'C:\Users\coool\.claude\projects\C--Users-coool-Desktop-MEC\898a9568-1d7d-4d9c-ad18-565708f92575.jsonl'
with open(path, encoding='utf-8', errors='replace') as f:
    for i, line in enumerate(f):
        try:
            obj = json.loads(line)
            role = obj.get('role','?')
            content = obj.get('content', '')
            text = ''
            if isinstance(content, list):
                for block in content:
                    if isinstance(block, dict) and block.get('type') == 'text':
                        text += block.get('text','')
            elif isinstance(content, str):
                text = content
            print(f'--- msg {i} role={role} len={len(text)} ---')
            if text:
                print(text[:500])
        except Exception as e:
            print(f'Line {i}: error {e}')
