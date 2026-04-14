import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EditBookDialog from '../EditBookDialog'

describe('EditBookDialog', () => {
  it('renders nothing when isOpen is false', () => {
    render(
      <EditBookDialog
        isOpen={false}
        title="My Book"
        author="Author"
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders dialog with title input and author input when open', () => {
    render(
      <EditBookDialog
        isOpen={true}
        title="My Book"
        author="Author Name"
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Edit Book')).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toHaveValue('My Book')
    expect(screen.getByLabelText('Author')).toHaveValue('Author Name')
  })

  it('calls onCancel when Cancel button is clicked', async () => {
    const onCancel = vi.fn()
    render(
      <EditBookDialog
        isOpen={true}
        title="Book"
        author="Auth"
        onSave={vi.fn()}
        onCancel={onCancel}
      />,
    )
    await userEvent.setup().click(screen.getByText('Cancel'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('calls onSave with trimmed values when form is submitted', async () => {
    const onSave = vi.fn()
    render(
      <EditBookDialog
        isOpen={true}
        title="  Book  "
        author="  Auth  "
        onSave={onSave}
        onCancel={vi.fn()}
      />,
    )
    await userEvent.setup().click(screen.getByText('Save'))
    expect(onSave).toHaveBeenCalledWith({ title: 'Book', author: 'Auth' })
  })

  it('disables Save when title is empty', () => {
    render(
      <EditBookDialog
        isOpen={true}
        title=""
        author="Auth"
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect(screen.getByText('Save')).toBeDisabled()
  })

  it('disables Save when author is empty', () => {
    render(
      <EditBookDialog
        isOpen={true}
        title="Book"
        author=""
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect(screen.getByText('Save')).toBeDisabled()
  })

  it('calls onCancel when overlay is clicked', () => {
    const onCancel = vi.fn()
    render(
      <EditBookDialog
        isOpen={true}
        title="Book"
        author="Auth"
        onSave={vi.fn()}
        onCancel={onCancel}
      />,
    )
    fireEvent.click(screen.getByRole('dialog'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel on ESC key', () => {
    const onCancel = vi.fn()
    render(
      <EditBookDialog
        isOpen={true}
        title="Book"
        author="Auth"
        onSave={vi.fn()}
        onCancel={onCancel}
      />,
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when close button is clicked', async () => {
    const onCancel = vi.fn()
    render(
      <EditBookDialog
        isOpen={true}
        title="Book"
        author="Auth"
        onSave={vi.fn()}
        onCancel={onCancel}
      />,
    )
    await userEvent.setup().click(screen.getByLabelText('Cancel'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
