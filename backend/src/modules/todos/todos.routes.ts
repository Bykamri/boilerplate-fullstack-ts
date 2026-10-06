import { Router } from 'express';
import { HttpError } from '../../lib/http-error.js';
import { todosRepository } from './todos.repository.js';
import { parseTodoId, validateCreateTodo, validateUpdateTodo } from './todos.validation.js';

// Express 5 forwards rejected promises to the error handler, so no try/catch needed.
export const todosRouter = Router();

todosRouter.get('/', async (_req, res) => {
  res.json(await todosRepository.findAll());
});

todosRouter.post('/', async (req, res) => {
  const input = validateCreateTodo(req.body);
  const todo = await todosRepository.create(input);
  res.status(201).json(todo);
});

todosRouter.patch('/:id', async (req, res) => {
  const id = parseTodoId(req.params.id);
  const input = validateUpdateTodo(req.body);
  const todo = await todosRepository.update(id, input);
  if (!todo) throw new HttpError(404, 'Todo not found');
  res.json(todo);
});

todosRouter.delete('/:id', async (req, res) => {
  const id = parseTodoId(req.params.id);
  const deleted = await todosRepository.remove(id);
  if (!deleted) throw new HttpError(404, 'Todo not found');
  res.status(204).end();
});
