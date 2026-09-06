import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ResultActions from './ResultActions';

describe('ResultActions component', () => {
  it('renders all three action buttons', () => {
    render(
      <ResultActions
        onReuse={vi.fn()}
        onReset={vi.fn()}
        onDownload={vi.fn()}
        t={(k) => k}
      />
    );

    expect(screen.getByText('btn_reuse')).toBeInTheDocument();
    expect(screen.getByText('btn_reset')).toBeInTheDocument();
    expect(screen.getByText('btn_download')).toBeInTheDocument();
  });

  it('triggers onDownload when download button is clicked', () => {
    const handleDownload = vi.fn();
    render(
      <ResultActions
        onReuse={vi.fn()}
        onReset={vi.fn()}
        onDownload={handleDownload}
        t={(k) => k}
      />
    );

    fireEvent.click(screen.getByText('btn_download'));
    expect(handleDownload).toHaveBeenCalledTimes(1);
  });
});
