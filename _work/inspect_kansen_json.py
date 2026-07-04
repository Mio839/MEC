import json, sys

data = json.load(open(r'C:\Users\coool\Desktop\MEC\questions_kansen.json', encoding='utf-8'))
chapters = data['chapters']
ch1 = chapters[0]
questions = ch1.get('questions', [])

print(f'Chapters: {len(chapters)}')
print(f'Ch1 id: {ch1.get("id")}')
print(f'Ch1 questions: {len(questions)}')

if questions:
    print(f'First q keys: {list(questions[0].keys())}')
    # find q20
    for q in questions:
        uid = q.get('uid', '')
        if 'q20' in uid or q.get('num') == 20:
            sys.stdout.buffer.write(f'Q20 uid: {uid}\n'.encode('utf-8'))
            sys.stdout.buffer.write(json.dumps(q, ensure_ascii=False, indent=2)[:2000].encode('utf-8'))
            break
