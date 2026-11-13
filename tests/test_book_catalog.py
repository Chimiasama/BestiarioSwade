"""Regressões de conteúdo: python -m unittest discover -s tests -v."""
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / 'data/bookMonsters.json').read_text())
AUDIT = json.loads((ROOT / 'data/bookImportAudit.json').read_text())
BY_ID = {entry['id']: entry for entry in DATA}


def book(file, line):
    return BY_ID[f'book-swade_{file}-{line}']


class BookCatalogTests(unittest.TestCase):
    def test_inventory_accounts_for_each_detected_sheet(self):
        self.assertEqual(len(AUDIT['books']), 19)
        self.assertEqual(AUDIT['unresolved'], [])
        for item in AUDIT['books']:
            self.assertEqual(item['detected'], item['imported'] + len(item['outOfScope']) + len(item['duplicates']), item['book'])
        self.assertEqual(sum(item['imported'] for item in AUDIT['books']), 1060)
        self.assertEqual(len(DATA), 1060 + len(AUDIT['references']))

    def test_unique_ids_and_usable_sheet_fields(self):
        self.assertEqual(len(BY_ID), len(DATA))
        for item in DATA:
            with self.subTest(id=item['id']):
                self.assertNotIn(item['name'].casefold(), ['sem título', 'ficha', 'bestiário'])
                self.assertTrue(item['name'].strip())
                self.assertEqual(set(item['attributes']), {'agility', 'cunning', 'spirit', 'strength', 'vigor'})
                self.assertTrue(item['sourceText'].strip())
                self.assertLess(len(item['sourceText']), 15000)
                self.assertTrue(item['sourceReference']['ranges'])
                if not item.get('referenceOnly'):
                    self.assertIsInstance(item['parry'], int)
                    self.assertTrue(item['movement'])
                    if not item['skills']:
                        self.assertRegex(item['sourceText'], r'Perícias:\s*[—–-]', 'Perícias não devem desaparecer durante a extração')
                    for value in item['attributes'].values():
                        self.assertRegex(value, r'^(?:d\d+(?:[+-]\d+)?(?:\s*\(A\))?|\d+|[—–-])$')

    def test_pdf_column_order_does_not_mix_creatures(self):
        dragon = book('basico', 15720)
        air = book('basico', 15758)
        water = book('basico', 15822)
        earth = book('basico', 15916)
        self.assertEqual(dragon['attributes']['strength'], 'd12+8')
        self.assertEqual(dragon['toughness'], '20 (4)')
        self.assertIn('Sopro de Fogo', [a['name'] for a in dragon['abilities']])
        self.assertNotIn('Sopro de Fogo', [a['name'] for a in air['abilities']])
        self.assertIn('Jato D’água', [a['name'] for a in water['abilities']])
        self.assertNotIn('Resiliente', [a['name'] for a in water['abilities']])
        self.assertIn('Resiliente', [a['name'] for a in earth['abilities']])
        self.assertIn('Construto', [a['name'] for a in book('basico', 16191)['abilities']])
        self.assertNotIn('Construto', [a['name'] for a in book('basico', 16065)['abilities']])
        self.assertEqual(book('basico', 16456)['parry'], 6)
        self.assertEqual(book('pathfinder_basico', 19263)['name'], 'Esqueleto humano')
        self.assertIn('Mudança de Forma', [a['name'] for a in book('basico', 16579)['abilities']])
        self.assertEqual(book('deadlands', 15257)['name'], 'Ossada Demoníaca')

    def test_missing_values_and_optional_variants_are_not_invented(self):
        for item in DATA:
            if item.get('referenceOnly'):
                self.assertEqual(item['parry'], '—')
                self.assertEqual(set(item['attributes'].values()), {'—'})
                self.assertTrue(item['sourceWarnings'])
        for line in (8647, 10684):
            self.assertTrue(book('superpoderes', line)['sourceWarnings'])
            self.assertIn('Não informado', book('superpoderes', line)['movement'])
        wolf = book('horror', 12754)
        self.assertIn('Acossar', wolf['abilityVariants'])
        self.assertNotIn('Acossar', [a['name'] for a in wolf['abilities']])
        fog = BY_ID['reference-swade_deadlands-15209']
        self.assertIn('não tem estatísticas', fog['sourceText'])
        self.assertNotIn('Névoa', book('deadlands', 15257)['name'])


if __name__ == '__main__':
    unittest.main()
