# Frontend MyFinance

Instale o backend com `.venv\Scripts\python.exe -m pip install -r requirements.txt`. Aplique as migrações com `.venv\Scripts\python.exe manage.py migrate`.

Para usar os assets compilados com Django, execute `npm --prefix frontend ci` e `npm --prefix frontend run build`, depois inicie o Django na porta 8000. A entrada principal abre React após a compilação. A visão geral anterior está em `/django/`. Configure `MYFINANCE_REACT_DEFAULT=0` para voltar à entrada Django com os mesmos dados.

Para desenvolvimento, mantenha o Django na porta 8000 e execute `npm --prefix frontend run dev`. O Vite encaminha `/api/` ao Django. A configuração padrão usa a mesma origem do ponto de vista do navegador.

Os testes de componentes usam `npm --prefix frontend test`. Para integração, compile o frontend, instale o Playwright de `tests/browser` e rode `node --test tests/browser/react.test.cjs`. Para usar o Chrome instalado, configure `MYFINANCE_CHROMIUM_CHANNEL=chrome`.
