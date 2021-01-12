import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { fireEvent, render, wait } from '@testing-library/react'
import { NavLink } from 'react-router-dom'
import { Provider } from 'mobx-react'
import { BrowserRouter } from 'react-router-dom'

import { HowtoForm } from './Howto.form'

describe('Howto form', function() {
  let howtoStore
  let tagsStore
  let formValues
  let parentType

  beforeAll(function() {
    window.confirm = jest.fn(() => true)
  })

  beforeEach(function() {
    howtoStore = {
      uploadStatus: {
        Start: false,
        Cover: false,
        'Step Images': false,
        Files: false,
        Database: false,
        Complete: false,
      },
    }
    tagsStore = {
      categoryTags: [
        {
          categories: ['how-to'],
          label: 'test tag 1',
          image: 'test img',
        },
      ],
      setTagsCategory: () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
    }
    formValues = {
      files: [],
      tags: {},
      moderation: 'draft',
    }
    parentType = 'create'

    window.confirm.mockReset()
  })

  it('should not show the confirm dialog', async function() {
    let renderResult
    await wait(() => {
      renderResult = render(
        <Provider howtoStore={howtoStore} tagsStore={tagsStore}>
          <BrowserRouter>
            <NavLink to="/how-to">Test link</NavLink>
            <HowtoForm formValues={formValues} parentType={parentType} />
          </BrowserRouter>
        </Provider>,
      )
    })

    const testLink = await renderResult.findByText(/Test link/)
    fireEvent.click(
      testLink,
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      }),
    )

    expect(window.confirm).not.toBeCalled()
  })

  it('should show the confirm dialog, title change', async function() {
    let renderResult
    await wait(() => {
      renderResult = render(
        <Provider howtoStore={howtoStore} tagsStore={tagsStore}>
          <BrowserRouter>
            <NavLink to="/how-to">Test link</NavLink>
            <HowtoForm formValues={formValues} parentType={parentType} />
          </BrowserRouter>
        </Provider>,
      )
    })

    const titleInput = await renderResult.findByLabelText(/Title/)

    fireEvent.change(titleInput, { target: { value: 'Test title' } })

    const testLink = await renderResult.findByText(/Test link/)
    fireEvent.click(
      testLink,
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      }),
    )

    expect(window.confirm).toBeCalled()
  })
})
