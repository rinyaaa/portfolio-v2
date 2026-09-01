# 夜間自律タスク実行用の使い捨てサンドボックスイメージ(docs/night-run-design.md 0章)。
# ビルド時はネットワーク制限なし(ツールのインストールに必要)。
# 実行時のネットワーク制限は entrypoint.sh 経由の init-firewall.sh が担う。
# portfolio(Astro + React islands, npm)のツールチェーンはNode.js本体のみ。
# package.jsonのengines.nodeに合わせてNode 22系を使う。
FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
        git curl unzip xz-utils ca-certificates python3 \
        iptables ipset dnsutils jq \
    && rm -rf /var/lib/apt/lists/*

# GitHub CLI(公式apt repo)
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
        -o /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
        > /etc/apt/sources.list.d/github-cli.list \
    && apt-get update && apt-get install -y --no-install-recommends gh \
    && rm -rf /var/lib/apt/lists/*

# Claude Code CLI(npm配布パッケージ。ホスト側の native installer版と同一ソース)
RUN npm install -g @anthropic-ai/claude-code

# portfolio向けツールチェーン: ベースイメージのNode.js/npmのみで足りる
# (Astro/React/TypeScript/vitestはすべてnpmパッケージなので追加のSDKインストールは不要)。
# プロジェクト自体の依存(npm ci)はコンテナ起動後、init-firewallでregistry.npmjs.org
# を許可した状態でタスクごとにクローンしたリポジトリ内で行う(このDockerfileでは
# 焼き込まない)。実機/エミュレータが要るツールは対象外(night-run/README.mdのスコープ外を参照)。

RUN useradd -m -s /bin/bash runner

# サンドボックスマーカー(0.2節)。イメージに焼き込まれるためホスト側で偽装できない。
ENV NIGHT_RUNNER_SANDBOX=1
RUN touch /.sandbox-marker

COPY init-firewall.sh /usr/local/bin/init-firewall.sh
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/init-firewall.sh /usr/local/bin/entrypoint.sh

WORKDIR /workdir
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
