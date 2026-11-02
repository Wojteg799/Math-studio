import { TaskItem } from '../src/types/math.js';

export const INITIAL_MATH_TASKS: TaskItem[] = [
  {
    id: 'task-1',
    number: 'Zadanie 1',
    statementLatex: `Drut o całkowitej długości \\( L = 120\\text{ cm} \\) należy podzielić na krawędzie prostopadłościanu o podstawie kwadratowej o boku \\( x \\) i wysokości \\( h \\).

Wyznacz wymiary \\( x \\) oraz \\( h \\), dla których objętość tego prostopadłościanu jest największa. Oblicz tę maksymalną objętość \\( V_{\\max} \\).`,
    imageUrl: null
  },
  {
    id: 'task-2',
    number: 'Zadanie 2',
    statementLatex: `Dany jest wielomian z parametrem \\( m \\in \\mathbb{R} \\):
\\[ W(x) = x^3 - (m + 3)x^2 + (3m + 2)x - 2m \\]

Wyznacz wszystkie wartości parametru \\( m \\), dla których równanie \\( W(x) = 0 \\) ma trzy różne pierwiastki rzeczywiste \\( x_1, x_2, x_3 \\), spełniające warunek:
\\[ x_1^2 + x_2^2 + x_3^2 \\le 14 \\]`,
    imageUrl: null
  },
  {
    id: 'task-3',
    number: 'Zadanie 3',
    statementLatex: `Oblicz granicę ciągu \\( (a_n) \\) określonego dla \\( n \\ge 1 \\):
\\[ \\lim_{n \\to \\infty} \\left( \\frac{4n + 3}{4n - 1} \\right)^{3n + 2} \\]`,
    imageUrl: null
  },
  {
    id: 'task-4',
    number: 'Zadanie 4',
    statementLatex: `Rozwiąż równanie trygonometryczne:
\\[ \\sin(2x) + \\sqrt{3} \\cos(2x) = 2 \\sin(x) \\]
w przedziale \\( x \\in [0, 2\\pi] \\).`,
    imageUrl: null
  },
  {
    id: 'task-5',
    number: 'Zadanie 5',
    statementLatex: `Dany jest okrąg \\( C \\) o równaniu:
\\[ x^2 + y^2 - 6x + 4y - 12 = 0 \\]

Wyznacz równania wszystkich prostych stycznych do okręgu \\( C \\), które przechodzą przez punkt \\( P = (9, 2) \\). Oblicz pole trójkąta utworzonego przez te styczne oraz oś \\( OX \\).`,
    imageUrl: null
  }
];
