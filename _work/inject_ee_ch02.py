import sys, re
sys.stdout.reconfigure(encoding='utf-8')

EE = {
"q81": '<div class="eb ee"><h4>□ 選択肢評価</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a ノロウイルス</td><td>○</td><td>エンベロープなしウイルス→アルコール消毒抵抗性→石鹸と流水での手洗いが必須</td></tr><tr><td>b 新型コロナウイルス</td><td>×</td><td>エンベロープ有ウイルス→アルコール消毒で不活化可能</td></tr><tr><td>c インフルエンザウイルス</td><td>×</td><td>エンベロープ有ウイルス→アルコール消毒有効</td></tr><tr><td>d 水痘・帯状疱疹ウイルス</td><td>×</td><td>エンベロープ有ウイルス→アルコール消毒有効</td></tr><tr><td>e HIV</td><td>×</td><td>エンベロープ有ウイルス→アルコール消毒有効</td></tr></table></div>',

"q82": '<div class="eb ee"><h4>□ 選択肢評価</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 解熱薬</td><td>×</td><td>脱水が主問題→解熱だけでは対処不足</td></tr><tr><td>b 止痢薬</td><td>×</td><td>腸管蠕動を止めると毒素・ウイルスの排出が遅れる→禁忌</td></tr><tr><td>c 昇圧薬</td><td>×</td><td>脱水による循環血液量減少→まず輸液で容量補充が先</td></tr><tr><td>d 細胞外液</td><td>○</td><td>嘔吐・下痢による脱水→生理食塩液や乳酸リンゲル液で細胞外液を補充</td></tr><tr><td>e 抗ウイルス薬</td><td>×</td><td>ノロウイルスに有効な抗ウイルス薬はない（対症療法が基本）</td></tr></table></div>',

"q84": '<div class="eb ee"><h4>□ ノロウイルス嘔吐物処理（誤り選択）</h4><table class="tb"><tr><th>手順</th><th>評価</th><th>根拠</th></tr><tr><td>①ペーパータオルで拭き取る</td><td>正しい</td><td>固形物を先に除去する→飛散防止のため重ねて拭き取る</td></tr><tr><td>②ビニール袋に密封廃棄</td><td>正しい</td><td>二重にして密封→外部へのウイルス拡散防止</td></tr><tr><td>③医療廃棄物専用へ廃棄</td><td>正しい</td><td>感染性廃棄物として適切に処理</td></tr><tr><td>④アルコール綿で消毒（誤り）</td><td>○（誤り）</td><td>ノロウイルスはエンベロープなし→アルコール無効→次亜塩素酸Na（0.5〜1%）が正しい</td></tr><tr><td>⑤流水と石鹸で手洗い</td><td>正しい</td><td>ノロウイルスはアルコール抵抗性→石鹸と流水による手洗いが有効</td></tr></table></div>',

"q86": '<div class="eb ee"><h4>□ バーベキュー後の血便下痢（3つ選べ）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a Escherichia coli（腸管出血性大腸菌）</td><td>○</td><td>牛肉→EHEC O157→ベロ毒素産生→血便・HUSリスク</td></tr><tr><td>b Helicobacter pylori</td><td>×</td><td>胃粘膜に感染（消化性潰瘍・胃癌）→血便下痢の急性食中毒ではない</td></tr><tr><td>c Campylobacter jejuni</td><td>○</td><td>鶏肉→カンピロバクター食中毒→発熱・血便・下痢（2〜7日潜伏期）</td></tr><tr><td>d Pseudomonas aeruginosa</td><td>×</td><td>免疫不全患者に多い院内感染菌→バーベキュー食中毒の原因にならない</td></tr><tr><td>e Salmonella spp.</td><td>○</td><td>鶏肉・卵→サルモネラ食中毒→発熱・下痢・血便（6〜48時間潜伏期）</td></tr></table></div>',

"q89": '<div class="eb ee"><h4>□ ノロウイルス不活化に有効な方法</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 逆性石鹸（第四級アンモニウム塩）</td><td>×</td><td>エンベロープ有ウイルス・一般細菌に有効→ノロウイルス（エンベロープなし）には無効</td></tr><tr><td>b 40℃の温水</td><td>×</td><td>温度が低すぎる（ノロの熱不活化には85℃以上1分間以上が必要）</td></tr><tr><td>c 40%アルコール</td><td>×</td><td>アルコール濃度が低い上、ノロはエンベロープなしでアルコール抵抗性</td></tr><tr><td>d 1分間の赤外線照射</td><td>×</td><td>赤外線照射はノロウイルスの不活化に用いられる方法ではない</td></tr><tr><td>e 1,000ppm次亜塩素酸ナトリウム</td><td>○</td><td>次亜塩素酸Na（塩素系漂白剤）→ノロウイルスを確実に不活化（環境消毒に推奨）</td></tr></table></div>',

"q92": '<div class="eb ee"><h4>□ 脱水改善の指標（2つ選べ）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a CRP</td><td>×</td><td>炎症マーカー→脱水改善の直接指標にならない（改善に数日かかる）</td></tr><tr><td>b 体重</td><td>×</td><td>脱水改善の参考にはなるが、急性期での即時性・感度は低い</td></tr><tr><td>c 脈拍</td><td>○</td><td>脱水→頻脈→輸液後に脈拍数が正常化→循環改善の早期指標</td></tr><tr><td>d 尿比重</td><td>○</td><td>脱水→濃縮尿（比重高）→輸液後に尿量増加・尿希釈（比重低下）→腎灌流改善の指標</td></tr><tr><td>e 白血球数</td><td>×</td><td>感染症・炎症の指標→脱水改善の直接指標にならない</td></tr></table></div>',

"q96": '<div class="eb ee"><h4>□ 選択肢評価（缶詰食後の腹痛下痢）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 亜鉛中毒</td><td>×</td><td>亜鉛中毒は酸性飲料を亜鉛メッキ容器に入れた場合→缶詰開封直後での発症ではない</td></tr><tr><td>b 農薬中毒</td><td>×</td><td>農薬曝露歴の記載なし</td></tr><tr><td>c アニサキス症</td><td>×</td><td>生魚（刺身等）の摂取後に発症→缶詰食では考えにくい</td></tr><tr><td>d 細菌性食中毒</td><td>○</td><td>缶詰を開缶後すぐ食べた→適切な加熱なし→缶詰内の細菌（特に嫌気性菌のボツリヌス等）による食中毒</td></tr><tr><td>e 急性アルコール中毒</td><td>×</td><td>飲酒の記載なし</td></tr></table></div>',

"q97": '<div class="eb ee"><h4>□ 血便下痢の原因菌（2つ選べ）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a サルモネラ</td><td>○</td><td>集団感染（合宿）・鶏肉・卵→サルモネラ食中毒→発熱・腹痛・血性下痢（6〜48時間）</td></tr><tr><td>b ロタウイルス</td><td>×</td><td>乳幼児の白色水様下痢が特徴→発熱はあるが血便は少ない・9歳では典型的でない</td></tr><tr><td>c ノロウイルス</td><td>×</td><td>嘔吐・水様下痢が主体→血便は少ない</td></tr><tr><td>d 黄色ブドウ球菌</td><td>×</td><td>毒素型→潜伏期1〜6時間・嘔吐主体→血便は特徴的でない</td></tr><tr><td>e カンピロバクター</td><td>○</td><td>鶏肉（生や不十分加熱）→発熱・強い腹痛・血便下痢（2〜7日潜伏期）・少年野球合宿で多い</td></tr></table></div>',
}


def inject_ee(html_content, ee_data):
    cards_injected = 0

    def replace_card(m):
        nonlocal cards_injected
        card_html = m.group(0)
        qid_m = re.search(r'id="(q\d+)"', card_html)
        if not qid_m:
            return card_html
        qid = qid_m.group(1)
        if qid not in ee_data:
            return card_html
        if 'class="eb ee"' in card_html:
            return card_html
        ee_html = ee_data[qid]
        insert_marker = '</div></div></div></div>'
        pos = card_html.rfind(insert_marker)
        if pos == -1:
            return card_html
        new_card = card_html[:pos] + ee_html + insert_marker
        cards_injected += 1
        return new_card

    result = re.sub(
        r'<div class="qc"[^>]*>.*?(?=<div class="qc"|$)',
        replace_card,
        html_content,
        flags=re.DOTALL
    )
    print(f"Injected ee blocks: {cards_injected}")
    return result


with open(r'C:\Users\coool\Desktop\MEC\感染症\ch02_kansen_gi.html', encoding='utf-8') as f:
    content = f.read()

new_content = inject_ee(content, EE)

with open(r'C:\Users\coool\Desktop\MEC\感染症\ch02_kansen_gi.html', 'w', encoding='utf-8') as f:
    f.write(new_content)
print("ch02 written successfully")
