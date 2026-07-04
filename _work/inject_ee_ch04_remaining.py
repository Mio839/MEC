import sys, re
sys.stdout.reconfigure(encoding='utf-8')

EE_REMAINING = {
"q195": '<div class="eb ee"><h4>□ 菌血症・敗血症・ショックの定義</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 菌血症</td><td>○</td><td>血液培養で菌が検出される状態（敗血症と並存可能）</td></tr><tr><td>b 敗血症</td><td>○</td><td>感染症に起因する臓器障害（qSOFA≧2 or SOFA≧2）→本例で該当</td></tr><tr><td>c 多臓器不全</td><td>×</td><td>2臓器以上の機能不全→本例はまだそのレベルでない</td></tr><tr><td>d 敗血症性ショック</td><td>×</td><td>輸液後も収縮期血圧≦65mmHg→本例では血圧が回復</td></tr></table></div>',

"q201": '<div class="eb ee"><h4>□ 肺炎の分類（各選択肢）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 市中肺炎（CAP）</td><td>×</td><td>特別養護老人ホーム入所中→施設入所者はNHCAP（医療・介護関連）</td></tr><tr><td>b 院内肺炎（HAP）</td><td>×</td><td>入院中でない→HAPの定義に合わない</td></tr><tr><td>c 間質性肺炎</td><td>×</td><td>胸部X線の陰影パターンが間質性を示す記載なし</td></tr><tr><td>d 誤嚥性肺炎</td><td>○</td><td>高齢者＋意識低下→嚥下障害・誤嚥リスク高い</td></tr><tr><td>e 医療・介護関連肺炎（NHCAP）</td><td>○</td><td>長期療養施設入所者→NHCAPの定義に該当</td></tr></table></div>',

"q215": '<div class="eb ee"><h4>□ A-DROPスコアの構成要素</h4><table class="tb"><tr><th>選択肢</th><th>A-DROP</th><th>基準</th></tr><tr><td>a 年齢</td><td>Age（A）○</td><td>男性≧70歳 or 女性≧75歳で1点</td></tr><tr><td>b 体重</td><td>×（含まれない）</td><td>体重はA-DROPのスコア項目でない</td></tr><tr><td>c 身長</td><td>×（含まれない）</td><td>身長もA-DROPの評価項目でない</td></tr><tr><td>d 脱水</td><td>Dehydration（D）○</td><td>BUN≧21mg/dL または脱水で1点</td></tr><tr><td>e 呼吸数</td><td>Respiration（R）○</td><td>呼吸数≧30回/分で1点</td></tr></table></div>',
}

def inject_ee_targeted(html_content, ee_data):
    cards_injected = 0

    def replace_card(m):
        nonlocal cards_injected
        card_html = m.group(0)
        qid_match = re.search(r'id="(q\d+)"', card_html)
        if not qid_match:
            return card_html
        qid = qid_match.group(1)
        if qid not in ee_data:
            return card_html
        # Skip if ee already exists
        if 'class="eb ee"' in card_html:
            return card_html
        ee_html = ee_data[qid]
        insert_marker = '</div></div></div></div>'
        pos = card_html.rfind(insert_marker)
        if pos == -1:
            return card_html
        cards_injected += 1
        return card_html[:pos] + ee_html + insert_marker

    result = re.sub(
        r'<div class="qc"[^>]*>.*?(?=<div class="qc"|$)',
        replace_card,
        html_content,
        flags=re.DOTALL
    )
    print(f"Injected: {cards_injected}")
    return result

with open(r'C:\Users\coool\Desktop\MEC\感染症\ch04_kansen_resp.html', encoding='utf-8') as f:
    content = f.read()

new_content = inject_ee_targeted(content, EE_REMAINING)

ee_count = len(re.findall(r'class="[^"]*\bee\b[^"]*"', new_content))
print(f"Total ee after: {ee_count}")

with open(r'C:\Users\coool\Desktop\MEC\感染症\ch04_kansen_resp.html', 'w', encoding='utf-8') as f:
    f.write(new_content)
print("Done")
