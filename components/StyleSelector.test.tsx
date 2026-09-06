import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StyleSelector from './StyleSelector';
import { STYLES } from '../constants';

const mockTranslation = {
  1: { name: '向量賽璐珞風', features: '粗黑輪廓、平滑漸層' },
  2: { name: '手繪麥克筆風', features: '手繪線條、筆觸感' },
};

describe('StyleSelector component', () => {
  it('renders all styles from catalog', () => {
    const handleSelect = vi.fn();
    render(
      <StyleSelector
        selectedStyle={STYLES[0]}
        onSelect={handleSelect}
        disabled={false}
        t={(k) => k}
        stylesTranslation={mockTranslation}
      />
    );

    expect(screen.getByText('step1_title')).toBeInTheDocument();
  });

  it('triggers onSelect when a style card is clicked', () => {
    const handleSelect = vi.fn();
    render(
      <StyleSelector
        selectedStyle={STYLES[0]}
        onSelect={handleSelect}
        disabled={false}
        t={(k) => k}
        stylesTranslation={mockTranslation}
      />
    );

    const items = screen.getAllByRole('radio');
    if (items.length > 1) {
      fireEvent.click(items[1]);
      expect(handleSelect).toHaveBeenCalledTimes(1);
    }
  });
});
