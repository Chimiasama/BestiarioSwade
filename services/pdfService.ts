import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Monster } from '../types';
import { SimpleListItem, CompleteSheet, MonsterCardFront, MonsterCardBack } from '../components/PdfTemplates';

type PdfTemplate = 'simple' | 'complete' | 'card';

const A4_WIDTH = 210;
const A4_HEIGHT = 297;
const CARD_WIDTH = 70;
const CARD_HEIGHT = 120;

const renderComponentToCanvas = async (element: React.ReactElement): Promise<HTMLCanvasElement> => {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    const root = ReactDOM.createRoot(container);
    root.render(element);

    // Wait a moment for React to render and for styles to apply
    await new Promise(resolve => setTimeout(resolve, 200));

    const canvas = await html2canvas(container.firstChild as HTMLElement, {
      useCORS: true,
      scale: 2, // Higher scale for better quality
      backgroundColor: '#0f172a' // Match body bg
    });
    
    root.unmount();
    container.remove();
    return canvas;
};


export const generatePdf = async (monsters: Monster[], template: PdfTemplate) => {
    const pdf = new jsPDF({
        orientation: template === 'card' ? 'portrait' : 'p',
        unit: 'mm',
        format: template === 'card' ? [CARD_WIDTH, CARD_HEIGHT] : 'a4'
    });

    if (template === 'simple') {
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.width = `${A4_WIDTH}mm`;
        container.style.padding = '10mm';
        container.style.backgroundColor = '#0f172a';
        container.style.color = 'white';
        container.style.boxSizing = 'border-box';

        document.body.appendChild(container);
        
        const root = ReactDOM.createRoot(container);
        
        const listComponent = React.createElement(
            'div',
            null,
            React.createElement(
                'h1',
                { className: "font-creepster text-4xl text-red-600 mb-4" },
                "Monster Quick Reference"
            ),
            React.createElement(
                'div',
                { className: "columns-2 md:columns-3" },
                monsters.map(monster => React.createElement(SimpleListItem, { key: monster.id, monster: monster }))
            )
        );
        
        root.render(listComponent);

        // Wait a moment for React to render and for styles to apply
        await new Promise(resolve => setTimeout(resolve, 200));

        const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#0f172a' });
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, A4_WIDTH, A4_HEIGHT);

        root.unmount();
        container.remove();

    } else if (template === 'complete') {
        for (let i = 0; i < monsters.length; i++) {
            const canvas = await renderComponentToCanvas(React.createElement(CompleteSheet, { monster: monsters[i] }));
            const imgData = canvas.toDataURL('image/png');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = A4_WIDTH;
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            if (i > 0) pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        }
    } else if (template === 'card') {
         for (let i = 0; i < monsters.length; i++) {
            const monster = monsters[i];
            
            // Front
            const frontCanvas = await renderComponentToCanvas(React.createElement(MonsterCardFront, { monster: monster }));
            const frontImgData = frontCanvas.toDataURL('image/png');
            if (i > 0) pdf.addPage();
            pdf.addImage(frontImgData, 'PNG', 0, 0, CARD_WIDTH, CARD_HEIGHT);
            
            // Back
            pdf.addPage();
            const backCanvas = await renderComponentToCanvas(React.createElement(MonsterCardBack, { monster: monster }));
            const backImgData = backCanvas.toDataURL('image/png');
            pdf.addImage(backImgData, 'PNG', 0, 0, CARD_WIDTH, CARD_HEIGHT);
        }
    }

    pdf.save('bestiary_of_legends.pdf');
};