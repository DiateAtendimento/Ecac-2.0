// script.js

document.addEventListener('DOMContentLoaded', () => {
  const header  = document.querySelector('.site-header');
  const toggle  = document.querySelector('.nav__toggle');
  const navList = document.querySelector('.nav__list');
  let lastY = window.pageYOffset;

  // Efeito de ocultar/exibir header ao rolar
  window.addEventListener('scroll', () => {
    const y = window.pageYOffset;
    header.classList.toggle('scrolled', y > 50);

    if (y > lastY && y > 100) {
      header.classList.add('scroll-down');
      header.classList.remove('scroll-up');
    } else if (y < lastY) {
      header.classList.add('scroll-up');
      header.classList.remove('scroll-down');
    }

    lastY = y;
  });

  // Toggle do menu principal (mobile)
  toggle.addEventListener('click', () => {
    navList.classList.toggle('show');
  });

  // Fecha menu mobile ao redimensionar para desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      navList.classList.remove('show');
    }
  });

  // Toggle de submenus em mobile
  document.querySelectorAll('.nav__item.dropdown > .nav__link').forEach(link => {
    link.addEventListener('click', e => {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        const submenu = link.nextElementSibling;
        submenu.classList.toggle('open');
      }
    });
  });
});



//Preencha com suas notícias e eventos reais
const noticiasData = [
  {
    title: 'Novo ECAC 2.0',
    description: 'Inovando o centro virtual...',
    date: '2025-06-27',
    img: '/public/assets/noticias_img/noticia5.svg',
    link: 'noticias.html'
  },
  {
    title: 'Descomplicando a Atuária',
    description: 'O papel da coordenação...',
    date: '2025-05-30',
    img: '/public/assets/noticias_img/noticia4.svg',
    link: 'noticia.html'
  },
  {
    title: 'Certificado profissional e o Pró-gestão',
    description: 'Desenvolva habilidades gerenciais...',
    date: '2025-05-19',
    img: '/public/assets/noticias_img/noticia3.svg',
    link: 'noticia1.html'
  },
  
];


/**
 * Renderiza até 3 cards num container.
 * @param {Object[]} data     – array de objetos (notícias ou eventos)
 * @param {string} selector    – seletor do container ('.noticias-cards' ou '.eventos-cards')
 * @param {'news'|'event'} type – tipo de card
 */
function renderCards(data, selector, type) {
  // Ordena por data desc
  data.sort((a, b) => new Date(b.date) - new Date(a.date));
  const container = document.querySelector(selector);
  container.innerHTML = '';

  data.slice(0, 3).forEach((item, index) => {
    // Cria o link que será o card
    const card = document.createElement('div');
    card.className = type === 'news' ? 'news-card' : 'event-card';
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      window.open(item.link, '_blank');
    });

    if (index === 0) card.classList.add('highlight'); // destaca o mais recente

    // Imagem
    const img = document.createElement('img');
    img.src = item.img;
    img.alt = item.title;

    // Div de info
    const info = document.createElement('div');
    info.className = type === 'news' ? 'news-info' : 'event-info';

    // Título
    const h3 = document.createElement('h3');
    h3.textContent = item.title;
    info.appendChild(h3);

    // Descrição
    const desc = document.createElement('p');
    desc.innerHTML = `<em>${item.description}</em>`;
    info.appendChild(desc);

    if (type === 'news') {
      // Time para notícia
      const time = document.createElement('time');
      time.dateTime = item.date;
      time.textContent = new Date(item.date).toLocaleDateString('pt-BR');
      info.appendChild(time);
    } else {
      // Data e local para evento
      const dateP = document.createElement('p');
      dateP.textContent = new Date(item.date).toLocaleDateString('pt-BR');
      info.appendChild(dateP);

      const locP = document.createElement('p');
      locP.textContent = item.location;
      info.appendChild(locP);
    }

    // Monta e insere
    card.appendChild(img);
    card.appendChild(info);
    container.appendChild(card);
  });
}

// Dispara após o DOM estar pronto
document.addEventListener('DOMContentLoaded', () => {
  renderCards(noticiasData, '.noticias-cards', 'news');
  renderCards(eventosData, '.eventos-cards', 'event');
});


//PÁGINA CADPREV - Cadastro
const cadastros = {
  liberacao: {
    title: 'Acesso ao CADPREV',
    body: `
      <h3>1. Cadastro Inicial no CADPREV</h3>
      <ol>
        <li>
          <strong>Acesso ao sistema:</strong><br>
          <a href="https://cadprev.previdencia.gov.br/Cadprev/pages/publico/cadastrarUsuario.xhtml"
             target="_blank" rel="noopener">
            Portal de Cadastro CADPREV
          </a>
        </li>
        <li><strong>Preenchimento das informações;</strong></li>
        <li><strong>Confirmação do cadastro.</strong></li>
      </ol>

      <h3>2. Envio de Ofício Padrão</h3>
      <ul>
        <li>✅ Elaboração do ofício;</li>
        <li>✅ Envio via Sistema GESCON.</li>
      </ul>

      <h3>3. Envio do Ofício via GESCON</h3>
      <p>
        <strong>a. Acessar o GESCON:</strong> faça login com suas credenciais.<br>
        <strong>b. Navegação:</strong>
      </p>
      <ul>
        <li>✅ Menu → <em>Consulta</em></li>
        <li>✅ Subtópico → <em>Sobre os Sistemas do RPPS</em></li>
        <li>✅ Assunto → <em>CADPREV</em></li>
        <li>✅ Específico → <em>Liberação de Acesso</em></li>
      </ul>
      <p>
        <strong>c. Anexar ofício:</strong> verifique se todos os arquivos foram carregados antes de enviar.
      </p>

      <h3>📄 Modelos e Manuais</h3>
      <ul class="modal-links">
        <li>📄 <a href="https://www.gov.br/previdencia/pt-br/assuntos/rpps/sistemas/cadprev/modelo-de-oficio-para-autorizacao-de-acesso-ao-cadprev-3090921.docx"
               target="_blank">Modelo de Ofício</a></li>
        <li>🔑 <a href="https://cadprev.previdencia.gov.br/Cadprev/pages/solicitacaoSenha.xhtml"
               target="_blank">Solicitação de Senha</a></li>
        <li>🎥 <a href="https://youtu.be/BFse5XIsarE" target="_blank">Assinatura Digital (vídeo)</a></li>
      </ul>
    `
  },

  atribuicao: {
    title: 'Atribuição de Responsabilidade',
    body: `
      <h3>Acesso ao Sistema CADPREV</h3>
      <p>
        Entre no sistema pelo link:<br>
        <a href="https://cadprev.previdencia.gov.br/Cadprev/pages/index.xhtml" target="_blank">
          CADPREV – Login
        </a><br>
        Utilize seu CPF e senha.
      </p>

      <h3>1. Cadastro de Responsabilidade</h3>
      <ol>
        <li> Menu → <strong>Cadastros</strong> → <em>Cadastros</em></li>
        <li> Acesse <strong>Dados Cadastrais e Funcionais</strong></li>
        <li> Clique em <strong>+ Incluir</strong> para adicionar responsabilidade</li>
      </ol>

      <h3>2. Adição de Representante</h3>
      <ol>
        <li> Menu → <strong>Estrutura de Gestão/Requisitos dos Profissionais</strong></li>
        <li> Selecione <strong>Composição da Estrutura</strong> e a aba desejada</li>
        <li> Clique no lápis ao lado do cargo e escolha <strong>Adicionar Membro</strong></li>
      </ol>

      <h3>3. Encerramento de Responsabilidade</h3>
      <ul>
        <li>✅ Retorne em <em>Estrutura de Gestão → Composição da Estrutura</em></li>
        <li>✅ Localize o usuário e insira a <strong>Data Fim</strong></li>
      </ul>
    `
  },

  webconferenciaGeral: {
    title: 'Webconferência RPPS',
    body: `
      <h3>1. Requisitos Técnicos</h3>
      <ul>
        <li>🎤 Use computador/notebook com microfone</li>
        <li>📱 Se precisar, acesse pelo celular (áudio e chat disponíveis)</li>
      </ul>

      <h3>2. Cronograma</h3>
      <p>
        📅 Consulte o cronograma:<br>
        <a href="https://www.gov.br/previdencia/pt-br/assuntos/rpps/documentos/pdf_20221101_093554_0000.pdf"
           target="_blank">Cronograma de Webconferência</a>
      </p>
      <p>
            Liberação de acesso, orientação de preenchimento do DAIR/DPIN, ajuste de data de nascimento, levantamento de erros no Cadprev.        
      </p>

      <p>      
        ⏰ Horário de atendimento: ⏰
      </p>
      <ul>
        <li>📌Segunda Feira - 09:30 às 12:00h</li>

        <li>📌Quarta Feira - 09:30 às 12:00h</li>

        <li>📌Sexta Feira - 09:30 às 12:00h</li>
      </ul>

      <h3>3. Atenção</h3>
      <p>⚠️ Informe desistência à coordenação para liberar seu horário.</p>

      <h3>4. Agendamento</h3>
      <p>
        📆 Agende aqui:<br>
        <a href="https://outlook.office365.com/owa/calendar/Webconferncia1@mte.gov.br/bookings/"
           target="_blank">Agenda de Horários – Webconferência</a>
      </p>
    `
  },

  naoDesbloqueado: {
    title: 'Regularização de Acesso – CADPREV',
    body: `
      <p>Após análise do Ofício nº XXXX/2025, não foi possível desbloquear pois o usuário ainda não existe no sistema.</p>

      <h3>1ª Etapa – Cadastro & Pedido de Acesso</h3>
      <ol>
        <li> Acesse o portal: <a href="https://cadprev.previdencia.gov.br/Cadprev/pages/publico/cadastrarUsuario.xhtml"
                                   target="_blank">CADPREV – Cadastro</a></li>
        <li> Preencha todas as informações</li>
        <li> Confirme usuário e senha</li>
      </ol>

      <h3>2ª Etapa – Envio de Ofício no GESCON</h3>
      <ol>
        <li> Elabore o Ofício (use <a href="https://www.gov.br/previdencia/pt-br/assuntos/rpps/sistemas/cadprev/modelo-de-oficio-para-autorizacao-de-acesso-ao-cadprev-3090921.docx"
                                       target="_blank">modelo</a>)</li>
        <li> Acesse GESCON → Consulta → Sistemas do RPPS → CADPREV → Liberação de Acesso → anexe e envie</li>
      </ol>

      <h3>3ª Etapa – Vinculação de Responsabilidades</h3>
      <ol>
        <li> Login no CADPREV</li>
        <li> Cadastros → Dados Cadastrais e Funcionais → + Incluir</li>
        <li> Estrutura de Gestão → Composição da Estrutura → editar cargo → Adicionar Membro</li>
        <li> Para encerrar, adicione a Data Fim</li>
      </ol>
    `
  },

  liberadoSemResponsabilidade: {
    title: 'Acesso Desbloqueado – CADPREV',
    body: `
      <p>O acesso foi desbloqueado!</p>

      <h3>1ª Etapa – Vinculação ao Sistema</h3>
      <ol>
        <li> Acesse: <a href="https://cadprev.previdencia.gov.br/Cadprev/pages/index.xhtml"
                          target="_blank">Entrar no CADPREV</a></li>
        <li> Cadastros → Dados Cadastrais e Funcionais → + Incluir</li>
        <li> Estrutura de Gestão → Composição da Estrutura → editar cargo → Adicionar Membro</li>
        <li> Para encerrar, insira a Data Fim</li>
      </ol>
    `
  },

  liberadoComSucesso: {
    title: 'Orientações Pós-Desbloqueio – CADPREV',
    body: `
      <p>Informamos que o acesso foi desbloqueado com sucesso!</p>

      <h3>Links Úteis</h3>
      <ul class="modal-links">
        <li>📄 <a href="https://www.gov.br/previdencia/pt-br/assuntos/rpps/sistemas/cadprev/modelo-de-oficio-para-autorizacao-de-acesso-ao-cadprev-3090921.docx"
               target="_blank">Modelo de Ofício</a></li>
        <li>🔑 <a href="https://cadprev.previdencia.gov.br/Cadprev/pages/solicitacaoSenha.xhtml"
               target="_blank">Troca de Senha</a></li>
        <li>📘 <a href="https://www.gov.br/previdencia/pt-br/assuntos/rpps/sistemas/cadprev/cadprev-manual-de-acesso-de-usuario-externo-26-04-2019.pdf"
               target="_blank">Manual de Acesso</a></li>
        <li>👤 <a href="https://cadprev.previdencia.gov.br/Cadprev/pages/publico/cadastrarUsuario.xhtml"
               target="_blank">Cadastro de Usuários</a></li>
        <li>🖊️ <a href="https://youtu.be/BFse5XIsarE" target="_blank">Assinatura Digital (vídeo)</a></li>
      </ul>
    `
  }
};

// PÁGINA CADPREV – Passo a Passo Repasse/Parcelamento
const repasseParcelamento = {
  consultaDIPR: {
    title: 'Consulta de Informações Previdenciárias e Repasse – DIPR',
    body: `<h3>Passo a Passo (Consulta de Informações Previdenciárias e Repasse)</h3>
      <ol>
        <li>Acesse o sistema CADPREV.</li>
        <li>Navegue até: <em>Repasse e Parcelamento &gt; Informações Previdenciárias e Repasse – DIPR &gt; Consultar Demonstrativos</em>.</li>
        <li>Selecione o Ente Federado desejado e clique em <strong>Pesquisar</strong>.</li>
        <li>Selecione o mesmo Ente e clique em <strong>Consultar</strong>.</li>
        <li>Todos os Demonstrativos de Informações Previdenciárias e Repasse serão exibidos.</li>
      </ol>
      
      <p>Observe as colunas <em>Exercício</em>, <em>Bimestre</em>, <em>Assinatura Digital</em> ou 
      <em>Visualizar Declaração de Veracidade Digitalizada</em>:</p>
      <ul>
        <li><strong>Assinatura Digital</strong> – ✅</li>
        <li><strong>Visualizar Declaração de Veracidade Digitalizada</strong> – 🕑</li>
      </ul>
      
      <h4>Atenção</h4>
      <p>Existem duas declarações de veracidade:</p>
      <ul>
        <li><strong>Declaração Nova:</strong> assíncrona e feita digitalmente via CADPREV; 
            consulte nas colunas “Assinatura Digital” e “Detalhar Assinaturas”.</li>
        <li><strong>Declaração Antiga:</strong> arquivo assinado externamente; confira em 
            “Visualizar Declaração de Veracidade Digitalizada”.</li>
      </ul>
      
      <p>Hoje, toda retificação exige assinatura digital. Se o ajuste for assinado pelo gestor em exercício 
      (e não pelo gestor da época), o documento sairá com a data atual, em conformidade com o direito administrativo.</p>
    `
  },
  consistenciaCaraterContributivo: {
  title: 'Consistência e Caráter Contributivo – DIPR',
  body: ` <h3>Passo a Passo (Verificação de Informações Previdenciárias e Repasses)</h3>
      <ol>
        <li>Acesse o sistema CADPREV.</li>
        <li>Navegue até: <em>Repasse e Parcelamento &gt; Informações Previdenciárias e Repasse – DIPR &gt; Consultar Demonstrativos</em>.</li>
        <li>Selecione o Ente desejado e clique em <strong>Pesquisar</strong>.</li>
        <li>Caso o status esteja <strong>Ativo</strong>, verifique a tela <em>Visualizar Relatório de Irregularidades (PDF)</em>.</li>
        <li>Abra o PDF e confira as <strong>Regras Ativas</strong>.</li>
      </ol>
    `
  },
  regraInativaDipr: {
    title: 'Regra Inativa - DIPR',
    body: `
      <p>A regra de batimento com status INATIVA, na situação indicativa de divergência no DIPR, não configura a existência de irregularidades. </p>
    `
    
  },
  webconferenciaRP: {
    title: 'Webconferência RPPS',
    body: `
      <h3>1. Requisitos Técnicos</h3>
      <ul>
        <li>🎤 Use computador/notebook com microfone</li>
        <li>📱 Se precisar, acesse pelo celular (áudio e chat disponíveis)</li>
      </ul>

      <h3>2. Cronograma</h3>
      <p>
        📅 Consulte o cronograma:<br>
        <a href="https://www.gov.br/previdencia/pt-br/assuntos/rpps/documentos/pdf_20221101_093554_0000.pdf"
           target="_blank">Cronograma de Webconferência</a>
      </p>
      <p>
            Orientação de preenchimento do DIPR e Termos de Parcelamento, análise das regras de batimento, NAP e verificação de erros no processamento.
      </p>

      <p>      
        ⏰ Horário de atendimento: ⏰
      </p>
      <ul>
        <li>📌Segunda-feira: 14:30 às 17hrs</li>
      </ul>

      <h3>3. Atenção</h3>
      <p>⚠️ Informe desistência à coordenação para liberar seu horário.</p>

      <h3>4. Agendamento</h3>
      <p>
        📆 Agende aqui:<br>
        <a href="https://outlook.office365.com/owa/calendar/Webconferncia1@mte.gov.br/bookings/"
           target="_blank">Agenda de Horários – Webconferência</a>
      </p>
    `
  }

};

// PÁGINA CADPREV – Atuária
const atuaria = {
  equilibrioFinanceiroAtuarial: {
    title: 'Encaminhamento NTA, DRAA e Resultados',
    body: `    
      <h3>1° Passo: Verificação de Envio (DRAA)</h3>
      <ol>
        <li>Acesse o sistema CADPREV.</li>
        <li>Navegue até: <em>Atuária &gt; DRAA</em> e selecione “Consultar Demonstrativo após 2014”.</li>
        <li>Selecione o ente e clique em <strong>Pesquisar</strong>.</li>
        <li>Ao carregar, escolha o exercício e clique em <strong>Consultar</strong>.</li>
        <li>Serão listados os DRAA enviados. Para cada item, clique no ícone da lupa e confira o status de:</li>
        <ul>
          <li>Envio das planilhas dos fluxos atuariais;</li>
          <li>Envio do certificado assinado ou digitalizado;</li>
          <li>Envio do relatório da avaliação atuarial digitalizado.</li>
        </ul>
        <p><strong>Legenda dos Status:</strong><br>
          • Ação realizada com sucesso;<br>
          • Aguardando processamento;<br>
          • Processo rejeitado.
        </p>
      </ol>
      
      <h3>2° Passo: Verificação de Notificações</h3>
      <ol>
        <li>Acesse o CADPREV.</li>
        <li>Navegue até: <em>Atuária &gt; Consultar Notificações</em>.</li>
        <li>Preencha UF e Ente Federado e clique em <strong>Pesquisar</strong>.</li>
        <li>Será exibida a lista de notificações pendentes ou não respondidas.</li>
      </ol>
    `
  },
  webconferenciaAtuaria:{
    title: 'Webconferência RPPS',
    body:`
      <h3>1. Requisitos Técnicos</h3>
      <ul>
        <li>🎤 Use computador/notebook com microfone</li>
        <li>📱 Se precisar, acesse pelo celular (áudio e chat disponíveis)</li>
      </ul>

      <h3>2. Cronograma</h3>
      <p>
        📅 Consulte o cronograma:<br>
        <a href="https://www.gov.br/previdencia/pt-br/assuntos/rpps/documentos/pdf_20221101_093554_0000.pdf"
           target="_blank">Cronograma de Webconferência</a>
      </p>
      <p>
            Análise de Notificações e orientações sobre o DRAA        
      </p>

      <p>      
        ⏰ Horário de atendimento: ⏰
      </p>
      <ul>
        <li>📌Segunda-feira: 14:30 às 17hrs</li>
      </ul>

      <h3>3. Atenção</h3>
      <p>⚠️ Informe desistência à coordenação para liberar seu horário.</p>

      <h3>4. Agendamento</h3>
      <p>
        📆 Agende aqui:<br>
        <a href="https://outlook.office365.com/owa/calendar/Webconferncia1@mte.gov.br/bookings/"
           target="_blank">Agenda de Horários – Webconferência</a>
      </p>
    `
  }
};

// PÁGINA CADPREV – Contabilidade: Extrato de Irregularidades (CRP)
  const contabilidade = {
    extratoIrregularidades: {
      title: 'Verificação de Irregularidade – Envio de MSC (CRP)',
      body: `
        <h3>1. Consulta no CADPREV</h3>
        <ol>
          <li>Acesse o sistema CADPREV.</li>
          <li>Vá em: <em>Contabilidade > Matriz de Saldos Contábeis > Consultar Matriz de Saldos Contábeis</em>.</li>
          <li>Selecione o Ente Federado e clique em <strong>Pesquisar</strong>, depois em <strong>Selecionar</strong>.</li>
          <li>Clique em <strong>Consultar</strong>.</li>
        </ol>
        <p>Na lista de envios, acesse a última página:</p>
        <ul>
          <li>❌<span style="color:red;"> (x)</span>: falta de envio da MSC no período.</li>
          <li>✅<span style="color:green;"> ✓</span>: envio realizado com sucesso.</li>
        </ul>

        <h3>2. Verificação complementar no SICONFI</h3>
        <p>Se o status continuar em vermelho, confirme no SICONFI:</p>
        <ol>
          <li>Acesse <a href="https://siconfi.tesouro.gov.br/siconfi/pages/public/consulta_msc/consulta_msc_list.jsf"
            target="_blank" rel="noopener">SICONFI – Consulta de MSC</a>.</li>
          <li>Em <strong>Consultas > Consultar Matrizes > MSC</strong>, preencha:
            Esfera, Estado, Ente, Exercício, Periodicidade (Mensal), Período e Tipo de Matriz (MSC Agregada).</li>
          <li>Clique em <strong>Consultar</strong>.</li>
        </ol>
        <p>Se os arquivos XBRL e CSV não aparecerem, o envio não foi concluído corretamente pelo Ente.</p>
      `
    },
    // PÁGINA CADPREV – Contabilidade após Decreto nº 11.356/2023
    contabilidadeAposDecreto: {
      title: 'Contabilidade – Situação após Decreto nº 11.356/2023',
      body: `
        <p>Em atenção à sua solicitação, informamos que, após a recriação do Ministério da Previdência Social – MPS (Decreto nº 11.356/2023), a Divisão de Contabilidade foi extinta. Até o momento, não foi possível recuperar essa unidade, não sendo possível responder dúvidas relativas à contabilidade no CADPREV.</p>

        <h3>Recomendações</h3>
        <ul>
          <li><strong>Matriz de Saldos Contábeis – MSC</strong>: procure a Secretaria do Tesouro Nacional;</li>
          <li><strong>GESCON</strong>: consulte o suporte da Secretaria do Tesouro Nacional ou o Tribunal de Contas do Estado;</li>
          <li><strong>Questões gerais de contabilidade</strong>: entre em contato com o Tribunal de Contas do Estado.</li>
        </ul>
      `
    },
    mscFaltaEnvio: {
      title: 'MSC - Falta de Envio',
      body: `
        <p>Em relação à irregularidade apresentada junto ao critério <strong>"Envio das informações e dados contábeis, orçamentários e fiscais do RPPS"</strong> do Município Louveira/SP, consta o não envio das informações ao Sistema de Informações Contábeis e Fiscais do Setor Público Brasileiro (SICONFI), referente à Matriz de Saldos Contábeis (MSC) do PO 10.132 do RPPS, relativo a dezembro de 2023, conforme consulta realizada no CADPREV – Sistema de Informações dos Regimes Próprios de Previdência Social.</p>
        <p><em>Fonte: CADPREV – 29/02/2024</em></p>
        <p><em>Fonte: SICONFI – 29/02/2024</em></p>
        <p>Dessa maneira, o envio das informações contábeis, orçamentárias e fiscais pelos RPPS permite verificar se os procedimentos contábeis estão em conformidade com a Contabilidade Aplicada ao Setor Público, alicerçados nos Princípios Fundamentais de Contabilidade (PFC) e nas Normas Brasileiras de Contabilidade Aplicadas ao Setor Público (NBCASP), nos termos do Art. 85 e alínea "a", inciso V, do Art. 241 da Portaria MTP nº 1.467/2022.</p>
        <p>Com fundamento no Art. 163-A da Constituição Federal de 1988 e no § 2º do Art. 48 da Lei Complementar nº 101/2000 (Lei de Responsabilidade Fiscal), que estabelecem a obrigatoriedade de envio dos instrumentos de transparência fiscal e das informações contábeis, orçamentárias e fiscais pelos RPPS, na periodicidade, formato e sistema definidos pelo órgão central de contabilidade da União, para divulgação eletrônica de amplo acesso.</p>
        <p>Dessa forma, o Município de Louveira/SP deverá encaminhar as informações referentes a dezembro de 2023 ao SICONFI, por meio da Matriz de Saldos Contábeis (MSC) e demais dados orçamentários e fiscais do PO 10.132 – RPPS Municipal, a fim de regularizar o critério de "Envio das informações e dados contábeis, orçamentários e fiscais".</p>
      `
    }
  };

// reutiliza o seu objeto 'cadastros' já definido acima...
const overlay  = document.getElementById('modalOverlay');
const titleEl  = document.getElementById('modalTitle');
const bodyEl   = document.getElementById('modalBody');
const closeBtn = document.getElementById('modalClose');
const copyBtn  = document.getElementById('modalCopy');

function openModal() {
  overlay.classList.add('active');
  document.body.classList.add('no-scroll');
}
function closeModal() {
  overlay.classList.remove('active');
  document.body.classList.remove('no-scroll');
}

// Agora vinculamos TODOS os cards de qualquer sessão
document.querySelectorAll('.grid-card').forEach(card => {
  card.addEventListener('click', () => {
    const key = card.dataset.key;
    const data = cadastros[key] || repasseParcelamento[key] || atuaria[key] || contabilidade[key];
    if (!data) return;
    titleEl.textContent = data.title;
    bodyEl.innerHTML   = data.body;
    openModal();
  });
});


// fechar modal
closeBtn.addEventListener('click', closeModal);
overlay.addEventListener('click', e => {
  if (e.target === overlay) closeModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && overlay.classList.contains('active')) {
    closeModal();
  }
});

// copiar texto
copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(bodyEl.innerText.trim());
  copyBtn.textContent = '✅';
  setTimeout(() => copyBtn.textContent = '📋', 1500);
});


// Copiar conteúdo do modal
copyBtn.addEventListener('click', () => {
  const textToCopy = bodyEl.innerText.trim();
  navigator.clipboard.writeText(textToCopy)
    .then(() => {
      copyBtn.textContent = '✅';
      setTimeout(() => { copyBtn.textContent = '📋'; }, 1500);
    })
    .catch(() => {
      copyBtn.textContent = '❌';
      setTimeout(() => { copyBtn.textContent = '📋'; }, 1500);
    });
});

//abre fecha as sessões

document.addEventListener('DOMContentLoaded', () => {
  // Para cada seção (Cadastro, Repasse/Parcelamento, Atuária, Contabilidade…)
  document.querySelectorAll('section').forEach(section => {
    const titulo  = section.querySelector('.section-title');
    const conteudo = section.querySelector('.grid-section');
    if (!titulo || !conteudo) return;  // pula se faltar título ou conteúdo

    // 1. Esconde inicialmente
    conteudo.style.display = 'none';
    // 2. Visualiza que o título é clicável
    titulo.style.cursor = 'pointer';

    // 3. Ao clicar no título, alterna a visibilidade
    titulo.addEventListener('click', () => {
      section.classList.toggle('open');
      if (conteudo.style.display === 'none') {
        conteudo.style.display = 'grid';   // volta ao grid original
      } else {
        conteudo.style.display = 'none';   // oculta de novo
      }
    });
  });
});

