# Ticino Unihockey – Cena di Gala (Lotteria + Asta Maglie)

Applicazione web **semplice e pronta per evento singolo**.

- Lingua: italiano
- UI: colori rosso/blu su sfondo bianco
- Moduli: lotteria (100 buste) + asta silenziosa maglie
- Accesso admin con password
- Export CSV
- Deploy low-cost su AWS

## 1) Architettura consigliata (LOW COST)

### Scelta: **Opzione A – 1 sola EC2 (consigliata e più economica)**

Per questo evento temporaneo la soluzione più economica e affidabile è:

- **1 EC2 t3.micro** (o t4g.micro se disponibile)
- Docker Compose con:
  - container app Next.js
  - container PostgreSQL

**Perché è la più economica**:
- 1 solo servizio principale (EC2)
- niente RDS separato
- niente load balancer
- setup in meno di 1 ora
- spegnimento totale immediato a fine evento

## 2) Prerequisiti

- PC con Docker Desktop installato
- Account AWS attivo
- Accesso SSH alla EC2

## 3) Configurazione ambiente

1. Copiare file esempio:

```bash
cp .env.example .env
```

2. Aprire `.env` e impostare:

- `ADMIN_PASSWORD` = password operatore
- `SESSION_SECRET` = stringa lunga casuale

Per uso Docker Compose locale lasciare `DATABASE_URL` come nel file esempio.

## 4) Avvio locale (test completo)

```bash
docker compose up --build -d
```

Aprire:
- Home: http://localhost:3000
- Lotteria pubblica: http://localhost:3000/lotteria
- Asta pubblica: http://localhost:3000/asta
- Admin: http://localhost:3000/admin

Stop:

```bash
docker compose down
```

## 5) Database: migrazioni + seed

L’app container esegue automaticamente all’avvio:
- `prisma migrate deploy`
- `prisma db seed`

Quindi crea automaticamente:
- 100 buste lotteria (1–100)
- maglie iniziali definite in `prisma/seed-data.json`

### Modificare maglie iniziali

Editare `prisma/seed-data.json`, poi rilanciare con DB pulito:

```bash
docker compose down -v
docker compose up --build -d
```

## 6) Utilizzo durante evento

## URL pubblici
- `/`
- `/lotteria`
- `/asta`

## URL admin
- `/admin`
- `/admin/lotteria`
- `/admin/asta`

## Login admin
- password definita in `ADMIN_PASSWORD`

## Cambiare password admin
1. Modificare `.env`
2. Riavviare app:

```bash
docker compose restart app
```

## 7) Operazioni rapide durante evento

### Riavviare tutto
```bash
docker compose restart
```

### Riavviare solo applicazione
```bash
docker compose restart app
```

### Verificare log in diretta
```bash
docker compose logs -f app
```

### Se qualcosa si blocca
1. `docker compose restart`
2. controllare log
3. se necessario ricreare solo app:

```bash
docker compose up --build -d app
```

## 8) Export e backup

### Export CSV (da admin)
- Lotteria: `/api/export/lotteria`
- Asta + offerte: `/api/export/asta`

### Backup database semplice
Creare dump SQL:

```bash
docker compose exec -T db pg_dump -U postgres -d ticino_gala > backup_ticino_gala.sql
```

Ripristino:

```bash
docker compose exec -T db psql -U postgres -d ticino_gala < backup_ticino_gala.sql
```

## 9) Deploy AWS (EC2) step-by-step

### A. Creare EC2
- Tipo: `t3.micro`
- OS: Ubuntu 24.04 LTS
- Security Group:
  - TCP 22 (SSH) dal tuo IP
  - TCP 3000 (web evento) da 0.0.0.0/0

### B. Installare Docker sulla EC2

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```

Disconnettersi e rientrare in SSH.

### C. Caricare il progetto

```bash
git clone <URL_REPOSITORY>
cd tiuhgala
cp .env.example .env
nano .env
```

Impostare password admin e secret.

### D. Avviare

```bash
docker compose up --build -d
```

Aprire browser:
`http://IP_PUBBLICO_EC2:3000`

## 10) Shutdown totale (evitare costi)

## Fine evento – fermare subito

### 1) Spegnere container
```bash
docker compose down
```

### 2) (Opzionale) cancellare anche dati locali container
```bash
docker compose down -v
```

### 3) In AWS: terminare EC2
- Console AWS → EC2 → Instance → **Terminate instance**

### 4) Verificare che non resti nulla a costo
- EC2: nessuna istanza running
- EBS: cancellare volumi orfani
- Elastic IP: rilasciare se allocato

## 11) Stima costi (molto approssimativa)

Con 1x t3.micro + disco base, per 1 weekend evento:
- pochi CHF/USD (ordine di grandezza molto basso)
- costo principale: EC2 runtime + storage EBS

Se istanza viene terminata a fine evento, i costi ricorrenti si azzerano quasi totalmente (resta solo eventuale storage non eliminato).

## 12) Troubleshooting

### Errore login admin
- Verificare `ADMIN_PASSWORD` in `.env`
- `docker compose restart app`

### Pagina non raggiungibile
- Verificare Security Group porta 3000
- `docker compose ps`
- `docker compose logs -f app`

### DB non parte
- `docker compose logs -f db`
- controllare che porta 5432 non sia occupata localmente

### Dati “spariti” dopo reset
- Probabile uso di `docker compose down -v` (cancella volume DB)

## 13) Struttura progetto

- `app/` pagine public/admin + API routes
- `components/` componenti UI
- `lib/` auth, prisma, formatter
- `prisma/schema.prisma` modelli database
- `prisma/seed.ts` seed automatico
- `prisma/seed-data.json` maglie modificabili
- `Dockerfile` build immagine app
- `docker-compose.yml` app + postgres
