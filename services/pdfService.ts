import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Monster } from '../types';
import {
  SimpleListItem,
  CompleteSheet,
  MonsterCardFront,
  MonsterCardBack,
  PdfTheme,
  FALLBACK_PDF_IMAGE,
} from '../components/PdfTemplates';

export type PdfTemplate = 'simple' | 'complete' | 'card';
export type { PdfTheme };

export interface GeneratePdfOptions {
  theme?: PdfTheme;
  fileName?: string;
  hideSecrets?: boolean;
}

export interface GeneratePdfResult {
  success: boolean;
  fileName: string;
  pageCount: number;
  error?: string;
}

const A4_WIDTH = 210;
const A4_HEIGHT = 297;
const CARD_WIDTH = 70;
const CARD_HEIGHT = 120;

const slugifyFileName = (name: string): string =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'criatura';

/**
 * Pre-converts external portrait URLs into local Data URLs so html2canvas
 * never drops images due to CORS or slow networks on Android WebView.
 */
const resolveImageDataUrl = async (url?: string): Promise<string> => {
  if (!url || !url.trim()) return FALLBACK_PDF_IMAGE;
  if (url.startsWith('data:')) return url;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const response = await fetch(url, {
      mode: 'cors',
      referrerPolicy: 'no-referrer',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return FALLBACK_PDF_IMAGE;
    const blob = await response.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : FALLBACK_PDF_IMAGE);
      reader.onerror = () => resolve(FALLBACK_PDF_IMAGE);
      reader.readAsDataURL(blob);
    });
  } catch {
    return FALLBACK_PDF_IMAGE;
  }
};

const prepareMonstersForPdf = async (monsters: Monster[]): Promise<Monster[]> => {
  const uniqueUrls = Array.from(new Set(monsters.map((m) => m.imageUrl).filter(Boolean)));
  const urlMap = new Map<string, string>();
  await Promise.all(
    uniqueUrls.map(async (url) => {
      urlMap.set(url, await resolveImageDataUrl(url));
    })
  );
  return monsters.map((m) => ({
    ...m,
    imageUrl: (m.imageUrl && urlMap.get(m.imageUrl)) || FALLBACK_PDF_IMAGE,
  }));
};

const waitForFontsAndImages = async (container: HTMLElement): Promise<void> => {
  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
  } catch {
    // Ignore font readiness failures
  }

  const imgs = Array.from(container.querySelectorAll('img'));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          const timer = setTimeout(resolve, 1500);
          img.onload = () => {
            clearTimeout(timer);
            resolve();
          };
          img.onerror = () => {
            clearTimeout(timer);
            resolve();
          };
        })
    )
  );

  await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 120)));
};

const renderComponentToCanvas = async (
  element: React.ReactElement,
  backgroundColor: string
): Promise<HTMLCanvasElement> => {
  const container = document.createElement('div');
  container.setAttribute('data-pdf-root', 'true');
  container.style.position = 'fixed';
  container.style.left = '-99999px';
  container.style.top = '0';
  container.style.zIndex = '-1';
  container.style.backgroundColor = backgroundColor;
  document.body.appendChild(container);

  const root = ReactDOM.createRoot(container);
  root.render(element);

  try {
    await waitForFontsAndImages(container);
    const target = (container.firstElementChild as HTMLElement) || container;
    const canvas = await html2canvas(target, {
      useCORS: true,
      allowTaint: true,
      scale: 2,
      backgroundColor,
      logging: false,
      onclone: (clonedDoc) => {
        // Strip Tailwind/theme overrides on html/body so oklch/color-mix CSS rules never crash html2canvas
        clonedDoc.documentElement.removeAttribute('data-theme');
        clonedDoc.documentElement.style.backgroundColor = backgroundColor;
        clonedDoc.body.style.backgroundColor = backgroundColor;
        clonedDoc.body.style.color = backgroundColor === '#0c0a09' ? '#f5f5f4' : '#1f140c';
      },
    });
    return canvas;
  } finally {
    root.unmount();
    container.remove();
  }
};

export const generatePdf = async (
  monsters: Monster[],
  template: PdfTemplate,
  options: GeneratePdfOptions = {}
): Promise<GeneratePdfResult> => {
  const theme: PdfTheme = options.theme || 'parchment';
  const hideSecrets = !!options.hideSecrets;
  const pageBg = theme === 'grimorio' ? '#0c0a09' : '#f7f0e2';
  const titleColor = theme === 'grimorio' ? '#fde68a' : '#6b1d12';

  const defaultFileName =
    monsters.length === 1
      ? `${template === 'card' ? 'carta' : 'ficha'}-${slugifyFileName(monsters[0].name)}.pdf`
      : `bestiario-de-lendas-${template}.pdf`;
  const fileName = options.fileName || defaultFileName;

  if (!monsters || monsters.length === 0) {
    return {
      success: false,
      fileName,
      pageCount: 0,
      error: 'Nenhuma criatura selecionada para exportar.',
    };
  }

  try {
    const safeMonsters = await prepareMonstersForPdf(monsters);

    const pdf = new jsPDF({
      orientation: template === 'card' ? 'portrait' : 'p',
      unit: 'mm',
      format: template === 'card' ? [CARD_WIDTH, CARD_HEIGHT] : 'a4',
    });

    if (template === 'simple') {
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-99999px';
      container.style.top = '0';
      container.style.width = `${A4_WIDTH}mm`;
      container.style.padding = '12mm';
      container.style.backgroundColor = pageBg;
      container.style.color = theme === 'grimorio' ? '#f5f5f4' : '#1f140c';
      container.style.boxSizing = 'border-box';
      document.body.appendChild(container);

      const root = ReactDOM.createRoot(container);
      const listComponent = React.createElement(
        'div',
        null,
        React.createElement(
          'h1',
          {
            className: 'font-cinzel',
            style: {
              fontSize: '24px',
              fontWeight: 800,
              color: titleColor,
              marginBottom: '12px',
              borderBottom: `2px solid ${theme === 'grimorio' ? '#92400e' : '#8c5828'}`,
              paddingBottom: '6px',
            },
          },
          'Lista Rápida do Mestre • Bestiário de Lendas'
        ),
        React.createElement(
          'div',
          {
            style: {
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
            },
          },
          safeMonsters.map((monster) =>
            React.createElement(SimpleListItem, { key: monster.id, monster, pdfTheme: theme })
          )
        )
      );

      root.render(listComponent);

      try {
        await waitForFontsAndImages(container);
        const canvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: pageBg,
          logging: false,
          onclone: (clonedDoc) => {
            clonedDoc.documentElement.removeAttribute('data-theme');
            clonedDoc.documentElement.style.backgroundColor = pageBg;
            clonedDoc.body.style.backgroundColor = pageBg;
          },
        });
        const imgData = canvas.toDataURL('image/png');
        const totalHeightMm = (canvas.height * A4_WIDTH) / canvas.width;
        let heightLeft = totalHeightMm;
        let positionY = 0;

        pdf.addImage(imgData, 'PNG', 0, positionY, A4_WIDTH, totalHeightMm);
        heightLeft -= A4_HEIGHT;
        while (heightLeft > 2) {
          positionY = heightLeft - totalHeightMm;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, positionY, A4_WIDTH, totalHeightMm);
          heightLeft -= A4_HEIGHT;
        }
      } finally {
        root.unmount();
        container.remove();
      }
    } else if (template === 'complete') {
      for (let i = 0; i < safeMonsters.length; i++) {
        const canvas = await renderComponentToCanvas(
          React.createElement(CompleteSheet, {
            monster: safeMonsters[i],
            pdfTheme: theme,
            hideSecrets,
          }),
          pageBg
        );
        const imgData = canvas.toDataURL('image/png');
        const imgProps = pdf.getImageProperties(imgData);
        const rawPdfHeight = (imgProps.height * A4_WIDTH) / imgProps.width;

        if (i > 0) pdf.addPage();

        if (rawPdfHeight <= A4_HEIGHT * 1.12) {
          // Fit cleanly onto 1 A4 page while preserving aspect ratio
          const fitScale = rawPdfHeight > A4_HEIGHT ? A4_HEIGHT / rawPdfHeight : 1;
          const drawW = A4_WIDTH * fitScale;
          const drawH = rawPdfHeight * fitScale;
          const offsetX = (A4_WIDTH - drawW) / 2;
          pdf.setFillColor(pageBg);
          pdf.rect(0, 0, A4_WIDTH, A4_HEIGHT, 'F');
          pdf.addImage(imgData, 'PNG', offsetX, 0, drawW, drawH);
        } else {
          // Paginate across multiple A4 pages cleanly
          let heightLeft = rawPdfHeight;
          let positionY = 0;
          pdf.addImage(imgData, 'PNG', 0, positionY, A4_WIDTH, rawPdfHeight);
          heightLeft -= A4_HEIGHT;
          while (heightLeft > 2) {
            positionY = heightLeft - rawPdfHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, positionY, A4_WIDTH, rawPdfHeight);
            heightLeft -= A4_HEIGHT;
          }
        }
      }
    } else if (template === 'card') {
      for (let i = 0; i < safeMonsters.length; i++) {
        const monster = safeMonsters[i];

        const frontCanvas = await renderComponentToCanvas(
          React.createElement(MonsterCardFront, {
            monster,
            pdfTheme: theme,
            hideSecrets,
          }),
          pageBg
        );
        const frontImgData = frontCanvas.toDataURL('image/png');
        if (i > 0) pdf.addPage();
        pdf.addImage(frontImgData, 'PNG', 0, 0, CARD_WIDTH, CARD_HEIGHT);

        pdf.addPage();
        const backCanvas = await renderComponentToCanvas(
          React.createElement(MonsterCardBack, {
            monster,
            pdfTheme: theme,
          }),
          pageBg
        );
        const backImgData = backCanvas.toDataURL('image/png');
        pdf.addImage(backImgData, 'PNG', 0, 0, CARD_WIDTH, CARD_HEIGHT);
      }
    }

    pdf.save(fileName);
    return {
      success: true,
      fileName,
      pageCount: pdf.getNumberOfPages(),
    };
  } catch (err: any) {
    console.error('Erro ao gerar PDF:', err);
    return {
      success: false,
      fileName,
      pageCount: 0,
      error: err?.message || 'Não foi possível gerar o arquivo PDF.',
    };
  }
};