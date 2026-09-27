import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string, fallback?: string) => fallback ?? key,
		i18n: { language: 'en', changeLanguage: vi.fn() },
	}),
}));

import IncidentsPage from '../incidents/page';

describe('IncidentsPage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders Incident Management heading', () => {
		render(<IncidentsPage />);
		expect(screen.getByText('Incident Management')).toBeInTheDocument();
	});

	it('shows empty state (No Incidents)', () => {
		render(<IncidentsPage />);
		expect(screen.getByText('No Incidents')).toBeInTheDocument();
	});

	it('shows Create First Incident button', () => {
		render(<IncidentsPage />);
		expect(screen.getByText('Create First Incident')).toBeInTheDocument();
	});

	it('shows search input', () => {
		render(<IncidentsPage />);
		expect(screen.getByPlaceholderText('Search incidents...')).toBeInTheDocument();
	});
});
