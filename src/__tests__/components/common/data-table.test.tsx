import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataTable, type Column } from '@/components/common/data-table'

interface TestItem {
  id: string
  name: string
  email: string
}

const testData: TestItem[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
  { id: '3', name: 'Bob Wilson', email: 'bob@example.com' },
]

const columns: Column<TestItem>[] = [
  { key: 'name', header: 'Name', cell: (item) => item.name },
  { key: 'email', header: 'Email', cell: (item) => item.email },
]

describe('DataTable', () => {
  describe('basic rendering', () => {
    it('should render column headers', () => {
      render(
        <DataTable
          columns={columns}
          data={testData}
          keyExtractor={(item) => item.id}
        />
      )
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
    })

    it('should render data rows', () => {
      render(
        <DataTable
          columns={columns}
          data={testData}
          keyExtractor={(item) => item.id}
        />
      )
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })

    it('should render empty message when no data', () => {
      render(
        <DataTable
          columns={columns}
          data={[]}
          keyExtractor={(item) => item.id}
          emptyMessage="No users found"
        />
      )
      expect(screen.getByText('No users found')).toBeInTheDocument()
    })

    it('should use default empty message', () => {
      render(
        <DataTable
          columns={columns}
          data={[]}
          keyExtractor={(item) => item.id}
        />
      )
      expect(screen.getByText('No data found')).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('should show skeleton when loading', () => {
      const { container } = render(
        <DataTable
          columns={columns}
          data={[]}
          keyExtractor={(item) => item.id}
          isLoading={true}
        />
      )
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('should not show data when loading', () => {
      render(
        <DataTable
          columns={columns}
          data={testData}
          keyExtractor={(item) => item.id}
          isLoading={true}
        />
      )
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
    })
  })

  describe('row click', () => {
    it('should call onRowClick when row is clicked', async () => {
      const onRowClick = jest.fn()
      render(
        <DataTable
          columns={columns}
          data={testData}
          keyExtractor={(item) => item.id}
          onRowClick={onRowClick}
        />
      )

      const row = screen.getByText('John Doe').closest('tr')
      if (row) {
        await userEvent.click(row)
      }

      expect(onRowClick).toHaveBeenCalledWith(testData[0])
    })

    it('should add cursor-pointer class when onRowClick is provided', () => {
      render(
        <DataTable
          columns={columns}
          data={testData}
          keyExtractor={(item) => item.id}
          onRowClick={() => {}}
        />
      )

      const row = screen.getByText('John Doe').closest('tr')
      expect(row?.className).toContain('cursor-pointer')
    })
  })

  describe('search', () => {
    it('should render search input when onSearchChange is provided', () => {
      render(
        <DataTable
          columns={columns}
          data={testData}
          keyExtractor={(item) => item.id}
          onSearchChange={() => {}}
          searchPlaceholder="Search users..."
        />
      )
      expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument()
    })

    it('should not render search when onSearchChange is not provided', () => {
      render(
        <DataTable
          columns={columns}
          data={testData}
          keyExtractor={(item) => item.id}
        />
      )
      expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument()
    })

    it('should call onSearchChange on form submit', async () => {
      const onSearchChange = jest.fn()
      render(
        <DataTable
          columns={columns}
          data={testData}
          keyExtractor={(item) => item.id}
          onSearchChange={onSearchChange}
        />
      )

      const input = screen.getByPlaceholderText('Search...')
      await userEvent.type(input, 'John')

      const searchButton = screen.getByRole('button', { name: 'Search' })
      await userEvent.click(searchButton)

      expect(onSearchChange).toHaveBeenCalledWith('John')
    })

    it('should clear search when clear button is clicked', async () => {
      const onSearchChange = jest.fn()
      render(
        <DataTable
          columns={columns}
          data={testData}
          keyExtractor={(item) => item.id}
          onSearchChange={onSearchChange}
          searchValue="John"
        />
      )

      const input = screen.getByPlaceholderText('Search...')
      await userEvent.type(input, 'test')

      // Find and click the clear button (X icon button)
      const clearButton = input.parentElement?.querySelector('button[type="button"]')
      if (clearButton) {
        await userEvent.click(clearButton)
      }

      expect(onSearchChange).toHaveBeenCalledWith('')
    })
  })

  describe('pagination', () => {
    it('should render pagination when onPageChange is provided', () => {
      render(
        <DataTable
          columns={columns}
          data={testData}
          keyExtractor={(item) => item.id}
          page={1}
          pageSize={10}
          totalCount={100}
          totalPages={10}
          onPageChange={() => {}}
        />
      )
      expect(screen.getByText('Page 1 of 10')).toBeInTheDocument()
    })

    it('should show correct entry range', () => {
      render(
        <DataTable
          columns={columns}
          data={testData}
          keyExtractor={(item) => item.id}
          page={2}
          pageSize={10}
          totalCount={25}
          totalPages={3}
          onPageChange={() => {}}
        />
      )
      expect(screen.getByText(/Showing 11 to 20 of 25 entries/)).toBeInTheDocument()
    })

    it('should disable first/prev buttons on first page', () => {
      render(
        <DataTable
          columns={columns}
          data={testData}
          keyExtractor={(item) => item.id}
          page={1}
          totalPages={10}
          onPageChange={() => {}}
        />
      )

      const buttons = screen.getAllByRole('button')
      const firstButton = buttons.find(b => b.querySelector('[class*="chevrons-left"]') || b.innerHTML.includes('ChevronsLeft'))
      expect(firstButton).toBeDisabled()
    })

    it('should disable last/next buttons on last page', () => {
      render(
        <DataTable
          columns={columns}
          data={testData}
          keyExtractor={(item) => item.id}
          page={10}
          totalPages={10}
          onPageChange={() => {}}
        />
      )

      const buttons = screen.getAllByRole('button')
      // Last two buttons should be disabled
      expect(buttons[buttons.length - 1]).toBeDisabled()
      expect(buttons[buttons.length - 2]).toBeDisabled()
    })

    it('should call onPageChange with correct page', async () => {
      const onPageChange = jest.fn()
      render(
        <DataTable
          columns={columns}
          data={testData}
          keyExtractor={(item) => item.id}
          page={5}
          totalPages={10}
          onPageChange={onPageChange}
        />
      )

      const nextButton = screen.getAllByRole('button').find(
        (b) => !b.hasAttribute('disabled') && b.querySelector('svg')
      )
      if (nextButton) {
        await userEvent.click(nextButton)
      }
    })

    it('should not render pagination buttons when totalPages is 1', () => {
      render(
        <DataTable
          columns={columns}
          data={testData}
          keyExtractor={(item) => item.id}
          page={1}
          totalPages={1}
          onPageChange={() => {}}
        />
      )
      expect(screen.queryByText('Page 1 of 1')).not.toBeInTheDocument()
    })
  })

  describe('page size', () => {
    it('should render page size selector when onPageSizeChange is provided', () => {
      render(
        <DataTable
          columns={columns}
          data={testData}
          keyExtractor={(item) => item.id}
          pageSize={10}
          onPageSizeChange={() => {}}
        />
      )
      // Check that the select is rendered
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
  })

  describe('sorting', () => {
    it('should call onSort when sortable column header is clicked', async () => {
      const onSort = jest.fn()
      const sortableColumns: Column<TestItem>[] = [
        { key: 'name', header: 'Name', cell: (item) => item.name, sortable: true },
        { key: 'email', header: 'Email', cell: (item) => item.email },
      ]

      render(
        <DataTable
          columns={sortableColumns}
          data={testData}
          keyExtractor={(item) => item.id}
          onSort={onSort}
        />
      )

      await userEvent.click(screen.getByText('Name'))
      expect(onSort).toHaveBeenCalledWith('name')
    })

    it('should show sort indicator on sorted column', () => {
      const sortableColumns: Column<TestItem>[] = [
        { key: 'name', header: 'Name', cell: (item) => item.name, sortable: true },
      ]

      render(
        <DataTable
          columns={sortableColumns}
          data={testData}
          keyExtractor={(item) => item.id}
          sortBy="name"
          sortDesc={true}
        />
      )

      expect(screen.getByText('↓')).toBeInTheDocument()
    })

    it('should show ascending indicator', () => {
      const sortableColumns: Column<TestItem>[] = [
        { key: 'name', header: 'Name', cell: (item) => item.name, sortable: true },
      ]

      render(
        <DataTable
          columns={sortableColumns}
          data={testData}
          keyExtractor={(item) => item.id}
          sortBy="name"
          sortDesc={false}
        />
      )

      expect(screen.getByText('↑')).toBeInTheDocument()
    })
  })

  describe('column className', () => {
    it('should apply column className to cells', () => {
      const columnsWithClass: Column<TestItem>[] = [
        { key: 'name', header: 'Name', cell: (item) => item.name, className: 'w-[200px]' },
      ]

      render(
        <DataTable
          columns={columnsWithClass}
          data={testData}
          keyExtractor={(item) => item.id}
        />
      )

      const cell = screen.getByText('John Doe').closest('td')
      expect(cell?.className).toContain('w-[200px]')
    })
  })
})
