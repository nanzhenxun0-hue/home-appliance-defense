function analyze() {
  let input = document.getElementById("urlInput").value.trim();
  let risk = 0;
  let reasons = [];

  try {
    const url = new URL(input);

    if (url.protocol === "http:") {
      risk += 2;
      reasons.push("httpは暗号化されていません");
    }

    if (url.hostname.includes("@")) {
      risk += 3;
      reasons.push("@が含まれています（偽装の可能性）");
    }

  } catch {
    risk += 2;
    reasons.push("URL形式が正しくありません");
  }

  if (input.length > 60) {
    risk += 1;
    reasons.push("URLが長すぎます");
  }

  if (/l[o0]g[i1]n/i.test(input)) {
    risk += 2;
    reasons.push("ログイン系ワードが含まれています");
  }

  let resultText = "";

  if (risk >= 4) {
    resultText = "⚠️ 危険な可能性があります\n\n理由:\n- " + reasons.join("\n- ");
  } else {
    resultText = "✅ 安全な可能性があります";
  }

  document.getElementById("result").innerText = resultText;

  // 投げ銭表示
  setTimeout(() => {
    document.getElementById("donateBox").style.display = "block";
  }, 1500);
}
