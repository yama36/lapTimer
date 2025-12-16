# FTPアップロード手順

## アップロードするファイル

### 1. 必須ファイル（必ずアップロード）

#### `dist/`フォルダ全体
```
dist/
├── index.js              # サーバー側のエントリーポイント
└── public/               # クライアント側のビルド済みファイル
    ├── index.html
    ├── assets/
    │   ├── index-*.js     # JavaScriptファイル（ハッシュ名）
    │   └── index-*.css    # CSSファイル（ハッシュ名）
    ├── images/
    │   ├── cyberpunk_bg.jpg
    │   └── runner_avatar_placeholder.jpg
    ├── apple-touch-icon.png
    ├── pwa-192x192.png
    ├── pwa-512x512.png
    ├── manifest.webmanifest
    ├── registerSW.js
    ├── sw.js
    └── workbox-*.js
```

#### `package.json`
- 依存関係の定義ファイル

#### `pnpm-lock.yaml`
- 依存関係のロックファイル（バージョン固定用）

### 2. サーバー上で作成するファイル

#### `.env`ファイル（FTPではアップロードしない）
サーバー上で直接作成してください：
```
NODE_ENV=production
DATABASE_URL=mysql://user:password@host:port/database
PORT=3000
```

## FTPアップロードの手順

### 方法1: フォルダごとアップロード

1. **`dist/`フォルダ全体をアップロード**
   - `dist/index.js`
   - `dist/public/`フォルダ全体（中身も含む）

2. **ルートファイルをアップロード**
   - `package.json`
   - `pnpm-lock.yaml`

### 方法2: 必要なファイルのみ選択

以下のファイル/フォルダを選択してアップロード：

```
✅ dist/index.js
✅ dist/public/ (フォルダ全体)
✅ package.json
✅ pnpm-lock.yaml
```

## SSHでサーバーに接続する方法

### Windowsの場合

#### 方法1: PowerShellまたはコマンドプロンプトを使用

1. **PowerShellまたはコマンドプロンプトを開く**
   - Windowsキーを押して「PowerShell」または「cmd」と入力

2. **SSHコマンドを実行**
   ```bash
   ssh username@server-address
   ```
   
   例：
   ```bash
   ssh user@example.com
   ssh user@192.168.1.100
   ssh user@example.com -p 2222  # ポート番号を指定する場合
   ```

3. **初回接続時の確認**
   - 「Are you sure you want to continue connecting (yes/no)?」と表示されたら「yes」と入力

4. **パスワード入力**
   - パスワードを求められたら、サーバーのパスワードを入力（入力中は表示されません）

#### 方法2: PuTTYを使用（GUIツール）

1. **PuTTYをダウンロード・インストール**
   - https://www.putty.org/ からダウンロード

2. **PuTTYを起動**
   - Host Name: サーバーのアドレス（例: example.com または IPアドレス）
   - Port: 22（デフォルト、変更されている場合はそのポート番号）
   - Connection type: SSH を選択

3. **接続**
   - 「Open」ボタンをクリック
   - 初回接続時は警告が表示されるので「はい」をクリック
   - ユーザー名とパスワードを入力

#### 方法3: WinSCPを使用（ファイル転送とSSH両方）

1. **WinSCPをダウンロード・インストール**
   - https://winscp.net/ からダウンロード

2. **接続設定**
   - ファイルプロトコル: SFTP
   - ホスト名: サーバーのアドレス
   - ユーザー名: サーバーのユーザー名
   - パスワード: サーバーのパスワード

3. **接続後、ターミナルを開く**
   - 接続後、メニューから「コマンド」→「ターミナルを開く」を選択

### Mac / Linuxの場合

1. **ターミナルを開く**
   - Mac: アプリケーション → ユーティリティ → ターミナル
   - または Spotlight検索（Cmd + Space）で「ターミナル」と入力
   - Linux: アプリケーションメニューからターミナルを起動

2. **SSHコマンドを実行**
   ```bash
   ssh username@server-address
   ```
   
   例：
   ```bash
   ssh user@example.com
   ssh user@192.168.1.100
   ssh user@example.com -p 2222  # ポート番号を指定する場合
   ```

3. **初回接続時の確認**
   - 「Are you sure you want to continue connecting (yes/no)?」と表示されたら「yes」と入力

4. **パスワード入力**
   - パスワードを求められたら、サーバーのパスワードを入力

### 必要な情報

サーバー管理者から以下を確認してください：

- **サーバーアドレス**: 例) `example.com` または `192.168.1.100`
- **ポート番号**: 通常は `22`（デフォルト）、変更されている場合はその番号
- **ユーザー名**: サーバーのユーザー名
- **パスワード**: サーバーのパスワード
- **SSH鍵**: パスワード認証ではなく鍵認証を使用する場合

### SSH鍵認証を使用する場合

パスワードではなくSSH鍵を使用する場合：

```bash
ssh -i /path/to/private-key username@server-address
```

例：
```bash
ssh -i ~/.ssh/id_rsa user@example.com
```

### 接続できない場合の確認事項

1. **サーバーアドレスが正しいか**
2. **ポート番号が正しいか**（デフォルトは22）
3. **ファイアウォールでSSHポートが開いているか**
4. **サーバーが起動しているか**
5. **ユーザー名とパスワードが正しいか**

## サーバー上でのセットアップ（FTPアップロード後）

コマンドはどこで入力しますか？  
→ サーバーにSSHで接続した後、表示される黒い画面（ターミナル/コンソール）上で、これらのコマンドを一行ずつ入力してください。

```bash
# 1. プロジェクトディレクトリに移動
cd /path/to/your/project

# 2. 依存関係のインストール（本番用）
pnpm install --prod

# 3. 環境変数ファイルの作成
nano .env
# 以下を記述：
# NODE_ENV=production
# DATABASE_URL=mysql://user:password@host:port/database
# PORT=3000

# 4. サーバーの起動
pnpm start
```

## サーバー上のディレクトリ構造

アップロード後の構造：

```
/your-server-path/
├── dist/
│   ├── index.js
│   └── public/
│       ├── index.html
│       ├── assets/
│       ├── images/
│       └── ...
├── package.json
├── pnpm-lock.yaml
├── .env              # サーバー上で作成
└── node_modules/     # pnpm installで生成
```

## 注意事項

⚠️ **アップロードしないファイル:**
- `node_modules/` - サーバー上で`pnpm install`で生成
- `.env` - 機密情報を含むため、サーバー上で直接作成
- `client/` - ソースコード（本番環境では不要）
- `server/` - ソースコード（本番環境では不要）
- `.git/` - Gitリポジトリ（不要）
- `.DS_Store` - macOSのシステムファイル（不要）

⚠️ **セキュリティ:**
- `.env`ファイルはFTPでアップロードせず、サーバー上で直接作成してください
- ファイルパーミッションを適切に設定してください（通常は644）

## ファイルサイズの目安

- `dist/index.js`: 約20KB
- `dist/public/`: 数MB（アセットファイルのサイズによる）
- `package.json`: 数KB
- `pnpm-lock.yaml`: 数百KB

合計: 通常は10MB以下（画像ファイルのサイズによる）
