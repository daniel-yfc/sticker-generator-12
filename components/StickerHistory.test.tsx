import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StickerHistory from './StickerHistory';
import { StickerRecord } from '../types';

const mockRecords: StickerRecord[] = [
  {
    id: 'rec-1',
    imageUrl: 'data:image/png;base64,mock1',
    styleId: 1,
    timestamp: Date.now(),
  },
  {
    id: 'rec-2',
    imageUrl: 'data:image/png;base64,mock2',
    styleId: 2,
    timestamp: Date.now(),
  },
];

describe('StickerHistory component', () => {
  it('displays empty state when history is empty', () => {
    render(
      <StickerHistory
        history={[]}
        onDelete={vi.fn()}
        t={(k) => k}
        stylesTranslation={{}}
      />
    );

    expect(screen.getByText('history_empty')).toBeInTheDocument();
  });

  it('renders history items and count', () => {
    render(
      <StickerHistory
        history={mockRecords}
        onDelete={vi.fn()}
        t={(k) => k}
        stylesTranslation={{}}
      />
    );

    expect(screen.getByText('2 / 50')).toBeInTheDocument();
  });

  it('calls onDelete when delete button clicked', () => {
    const handleDelete = vi.fn();
    render(
      <StickerHistory
        history={mockRecords}
        onDelete={handleDelete}
        t={(k) => k}
        stylesTranslation={{}}
      />
    );

    const deleteButtons = screen.getAllByTitle('Delete');
    expect(deleteButtons.length).toBe(2);
    fireEvent.click(deleteButtons[0]);
    expect(handleDelete).toHaveBeenCalledWith('rec-1');
  });
});
