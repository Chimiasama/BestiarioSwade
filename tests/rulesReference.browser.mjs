import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try{
 const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 const p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(process.env.APP_URL||'http://127.0.0.1:3000');
 const titles=await p.locator('.book-tile h3').allTextContents();assert.equal(titles.filter(t=>/Cidade.*Sol.*Vapor/.test(t)).length,1);assert.ok(titles.includes('Cidade do Sol a Vapor'));assert.ok(titles.includes('Livro Básico'));assert.ok(!titles.includes('Core Rules'));assert.equal(titles.filter(t=>/Arte da Guerra/.test(t)).length,1);assert.equal(titles.filter(t=>/Deadlands/.test(t)).length,1);
 await p.screenshot({path:'/tmp/scenarios-home.png'});
 await p.getByRole('heading',{name:'Cidade do Sol a Vapor',exact:true}).click();await p.getByRole('searchbox',{name:'Buscar criatura'}).fill('Centurião Ancestral');await p.getByRole('heading',{name:'Centurião Ancestral',exact:true}).click();
 await p.getByText('Cidade do Sol & Vapor — Livro do Criador · Extra',{exact:false}).waitFor();
 await p.getByRole('button',{name:'Consultar vantagem Golpe Poderoso',exact:true}).click();
 const dialog=p.getByRole('dialog',{name:'Consulta de regras'});const text=dialog.getByRole('article',{name:'Texto da regra'});const body=text.getByRole('region',{name:'Descrição completa da regra'});
 await body.getByText(/Curinga/).last().waitFor();assert.match(await text.innerText(),/Cidade do Sol a Vapor/);assert.match(await text.innerText(),/dano/i);
 await p.screenshot({path:'/tmp/reference-edge-mobile.png'});await p.keyboard.press('Escape');await p.getByRole('heading',{name:'Centurião Ancestral',exact:true}).waitFor();
 await p.getByRole('button',{name:'Consultar atributo Astúcia',exact:true}).click();await body.getByText(/Mede sua inteligência bruta/).waitFor();await p.keyboard.press('Escape');
 await p.getByRole('button',{name:'Rolar Astúcia',exact:true}).click();await p.getByRole('dialog',{name:'Rolador de dados'}).waitFor();await p.keyboard.press('Escape');
 await p.getByRole('button',{name:'Consultar perícia Lutar',exact:true}).click();await body.getByText(/combate/i).first().waitFor();await p.keyboard.press('Escape');
 await p.getByRole('button',{name:/^Rolar Lutar /}).click();await p.getByRole('dialog',{name:'Rolador de dados'}).waitFor();await p.keyboard.press('Escape');
 await p.getByRole('button',{name:'Voltar ao Compêndio'}).click();await p.getByRole('button',{name:/Compêndio Geral|Todos \(/}).click();
 const search=p.getByRole('searchbox',{name:'Buscar criatura'});await search.fill('Fjordstadiano Nobre');await p.getByRole('heading',{name:'Fjordstadiano Nobre',exact:true}).click();
 await p.getByRole('button',{name:'Consultar complicação Arrogante',exact:true}).click();await body.getByText(/arrogantes/i).waitFor();await p.keyboard.press('Escape');
 await p.getByRole('button',{name:'Voltar ao Compêndio'}).click();await search.fill('Chupacabra Brasileiro');await p.getByRole('heading',{name:'Chupacabra Brasileiro',exact:true}).click();
 await p.getByRole('button',{name:/^Consultar poder Invisibilidade/}).click();await text.getByRole('heading',{name:/invisibilidade/i}).waitFor();await body.getByText(/invis[ií]vel/i).first().waitFor();await p.keyboard.press('Escape');
 await p.getByRole('button',{name:'Consultar regra Aparar',exact:true}).click();await body.getByText(/metade do dado de Lutar/).waitFor();await p.keyboard.press('Escape');
 await p.getByRole('button',{name:'Consultar regras',exact:true}).click();await dialog.getByLabel('Buscar definição').fill('Regra inexistente xyz');await dialog.getByText(/Não há uma definição exata/).waitFor();await dialog.getByRole('button',{name:'Pesquisar em todas as definições'}).click();await dialog.getByLabel('Buscar definição').fill('Golpe Poderoso');await dialog.getByLabel('Tipo de regra').selectOption('advantage');await body.getByText(/Curinga/).last().waitFor();
 for(const width of [320,768,1440]){await p.setViewportSize({width,height:900});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width}px overflow`);}
 assert.deepEqual(errors,[]);console.log('PASS: scenario merging, basic-book rename, retained specific source, edge/hindrance/power/skill/attribute/derived-stat lookups, preserved dice actions, search, missing definitions, and responsive layout.');
}finally{await b.close();}
