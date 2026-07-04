with open('C:/Users/coool/Desktop/MEC/感染症/ch02_kansen_gi.html', 'r', encoding='utf-8') as f:
    content = f.read()
i1 = content.find('id="q88"')
# q88 の後の id="q90" (q89はウイルス腸炎セクション別ファイル？)
i2 = content.find('<div class="qc" id="q89"', i1+1)
if i2 == -1:
    i2 = i1 + 3000
print('i1:', i1, 'i2:', i2)
snippet = content[i1:i2]
with open('C:/Users/coool/Desktop/MEC/tmp_q88_html.txt', 'w', encoding='utf-8') as out:
    out.write(snippet)
print('len:', len(snippet))
