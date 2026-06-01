import '@mantine/core/styles.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider, createTheme } from '@mantine/core'
import './index.css'
import App from './App.jsx'

const oshunTheme = createTheme({
  primaryColor: 'gold',
  defaultRadius: 'md',
  defaultColorScheme: 'dark',
  colors: {
    gold: [
      '#FBF3DC', '#F4E4AF', '#EDD57E', '#E6C651',
      '#DFB82A', '#C8A84B', '#A08530', '#7A6122',
      '#543F14', '#2E1F08'
    ],
    teal: [
      '#E6F6F8', '#C2ECF0', '#9BE1E8', '#72D5E0',
      '#4AABBF', '#2B7A8C', '#1A5A6B', '#0B3A47',
      '#052028', '#020D12'
    ],
    navy: [
      '#E8EDF5', '#C7D2E6', '#A4B5D6', '#7F97C5',
      '#5B7AB4', '#3A5E9F', '#1A3A6B', '#0B1C3A',
      '#060F20', '#020810'
    ],
  },
  fontFamily: 'Jost, sans-serif',
  headings: { fontFamily: 'Playfair Display, serif' },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MantineProvider theme={oshunTheme} defaultColorScheme="dark">
      <App />
    </MantineProvider>
  </StrictMode>,
)
