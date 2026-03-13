---
name: Clean Modern Frontend Design
description: Diretrizes e práticas avançadas para criar interfaces web limpas, modernas e visualmente impressionantes, evitando a aparência de "design genérico de IA".
---

# 🎨 Clean Modern Frontend Design (Design Premium)

Esta skill define as melhores práticas para desenhar e implementar interfaces de usuário (UIs) que sejam elegantes, modernas e que impressionem o usuário à primeira vista. O objetivo principal é **evitar** designs básicos, estruturalmente pobres ou com aspecto de "código genérico gerado por IA".

## 1. 🔠 Tipografia Moderna
- **Fontes Premium**: Nunca use fontes padrão do navegador. Priorize famílias tipográficas modernas e limpas via Google Fonts, como: `Inter`, `Plus Jakarta Sans`, `Outfit`, `Manrope` ou `Satoshi`.
- **Hierarquia Clara**: Use pesos contrastantes (ex: Bold para títulos, Regular/Medium para corpo de texto).
- **Entrelinhas (Line Height)**: Textos de corpo devem ter `line-height` entre `1.5` e `1.7` para legibilidade. Títulos devem ser mais justos (`1.2` a `1.3`).
- **Letter Spacing**: Títulos muito grandes podem ter letter-spacing negativo sutil (ex: `-0.02em`). Letras maiúsculas ou rótulos (labels) devem ter letter-spacing positivo.

## 2. 🎨 Paleta de Cores e Estilos Básicos
- **Nunca use cores genéricas**: Evite "red", "blue", "green" diretos. Use valores HSL ou HEX refinados (ex: em vez de `#FF0000`, use `#EF4444`).
- **Dark Mode / Light Mode**: As interfaces devem suportar paletas harmoniosas.
  - *Light Mode*: Evite o `#FFFFFF` puro no fundo principal. Use tons levemente acinzentados (ex: `#F9FAFB`) e deixe o branco puro para cartões (cards).
  - *Dark Mode*: Nunca use `#000000` absoluto como fundo. Prefira cinzas escuros com tons azulados/arroxeados (ex: `#0F172A` ou `#111827`).
- **Gradientes Sutis**: Utilize gradientes de fundo sutis ou textos com gradiente (`-webkit-text-fill-color`) para destacar informações importantes.

## 3. 📐 Espaçamento e Layout (Whitespace)
- **Respiro é Fundamental**: Um design genérico de IA costuma ser aglomerado. Use *paddings* e *margins* generosos (escala de 4px ou 8px: 16px, 24px, 32px, 48px, 64px).
- **Flexbox e Grid**: Alinhe todos os elementos perfeitamente. Nunca deixe itens "flutuando" sem propósito.

## 4. 💎 Detalhes de Interface (UI Polish)
- **Bordas e Shadows**: 
  - Prefira bordas muito sutis (ex: `1px solid rgba(0, 0, 0, 0.05)`) a linhas escuras e muito contrastantes.
  - Sombras devem ser longas e difusas, usando múltiplas camadas em vez de um único `box-shadow` rígido. Exemplo: `box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);`.
- **Border Radius**: Bordas arredondadas modernas. Valores como `8px`, `12px` ou `16px` trazem uma sensação orgânica e premium.
- **Glassmorphism**: Quando fizer sentido, utilize painéis translúcidos com `backdrop-filter: blur(12px)` e fundos com leve transparência.

## 5. ✨ Interatividade e Micro-Animações
- **Transições Suaves**: Toda ação interativa (hover, focus, active) deve ter animação. Regra geral: `transition: all 0.2s ease-in-out;`.
- **Feedback Visual**: Botões devem ter interações fluídas (ex: um leve `transform: translateY(-1px)` no hover e `scale(0.98)` no click).
- **Focus Rings**: Não use o outline padrão azul estourado do navegador. Crie designs de *focus-ring* polidos, como: `box-shadow: 0 0 0 2px bg-color, 0 0 0 4px primary-color;`.

## 6. 🚫 Como Evitar a "Cara de Layout Gerado por IA" (Crucial)
O padrão de IA geralmente produz interfaces com blocos excessivamente simétricos, centralizados, sem personalidade e com contrastes básicos. Para fugir disso:

- **Assimetria Intencional e Quebra de Grid**: Não coloque tudo centralizado `text-align: center` e `justify-content: center` em cards. Alinhe textos à esquerda, crie grids assimétricos (ex: um card maior em destaque `grid-column: span 2` e outros menores ao lado).
- **Evite o "Card com borda sólida e sombra padrão"**: IAs adoram fazer `.card { border: 1px solid #ccc; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }`. **NÃO FAÇA ISSO**. Use blocos de cor com fundos levemente diferentes da página (ex: fundo `bg-gray-50`, card `bg-white`), bordas muito sutis (`border-gray-100/50`) ou o estilo "Glassmorphism" sutil.
- **Tipografia Heróica (Hero Text)**: Em vez de um `<h1>` padrão, use títulos massivos, com font-weight `800` ou `900`, tracking muito apertado (`letter-spacing: -0.04em`) e gradiente sutil no texto (`background-clip: text`).
- **Pequenos Detalhes (Micro-UI)**: Adicione elementos que "humanizam" o design:
  - *Badges* de status arredondados com cores suaves de fundo e texto forte (ex: fundo verde clarinho, texto verde escuro).
  - *Avatares* em cluster (overlapping avatars) para provas sociais.
  - *Background Patterns*: Em vez de branco sólido no hero/landing, use um grid sutil de background, bolhas de gradiente desfocadas (blur > 100px) posicionadas assimetricamente atrás dos elementos principais.
- **Botões "CTAs" Premium**: IAs fazem botões retangulares simples. Faça botões com efeitos de *glow* sutil no hover, bordas internas (`box-shadow: inset 0 1px 0 rgba(255,255,255,0.15)`), ou gradientes suaves.
- **Abandone Componentes Nativos Puros**: Nunca deixe inputs, selects ou scrollbars nativos. Estilize-os para se adequarem ao tema.

## 7. 📋 Checklist de Execução ao Desenhar UIs
1. [ ] Repensei a simetria? O layout parece construído por um designer humano focado em direcionar a atenção (assimetria proposital)?
2. [ ] Substituí o famigerado design de "card com sombra de 10px e borda preta" por algo mais limpo (apenas mudança sutil de background ou linhas de 1px ultra claras)?
3. [ ] Adicionei elementos de "Background Noise/Patterns" em nível herói para quebrar o fundo sólido monótono?
4. [ ] Meus CTAs (botões principais) parecem convidar o clique (inner shadows, glows)?
5. [ ] O espaçamento dos textos (line-height e letter-spacing) foi ajustado para remover o aspecto de "Times New Roman Arial"?

---
*Como o assistente DEVE agir ao se deparar com essa diretriz*: Você tem que construir interfaces que quando o usuário renderizar, a primeira reação dele seja "Uau, isso parece um template do Dribbble ou da Awwwards". Jogue fora os layouts em colunas centralizadas simples e adote uma abordagem ousada, moderna e extremamente elegante.
