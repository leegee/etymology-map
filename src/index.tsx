/* @refresh reload */
import { render } from 'solid-js/web'
import 'beercss';
import "flag-icons/css/flag-icons.min.css";
import App from './App'

const root = document.getElementById('root')

render(() => <App />, root!)
