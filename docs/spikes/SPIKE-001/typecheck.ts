import { client } from './generated/client.gen';
import { updateTask } from './generated/index';
import type {
  ProblemDetails,
  Task,
  UpdateTaskError,
  UpdateTaskInput,
  ValidationProblem,
} from './generated/index';

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2)
    ? true
    : false;
type Expect<Value extends true> = Value;

type _OptionalNullableDescription = Expect<
  Equal<UpdateTaskInput['description'], string | null | undefined>
>;
type _RequiredNullableDescription = Expect<
  Equal<Task['description'], string | null>
>;
type _OptionalNullableProject = Expect<
  Equal<Task['projectId'], string | null | undefined>
>;
type _ErrorUnion = Expect<
  Equal<UpdateTaskError, ProblemDetails | ValidationProblem>
>;

client.setConfig({
  credentials: 'include',
});

const result = await updateTask({
  body: {
    description: null,
    title: 'Strictly typed',
  },
  credentials: 'same-origin',
  headers: {
    'If-Match': '"task-version-1"',
    'X-CSRF-Token': 'synthetic-csrf-token',
  },
  path: {
    taskId: '00000000-0000-4000-8000-000000000001',
  },
});

result.response?.headers.get('ETag');
result.response?.headers.get('X-Request-Id');

if (result.error && 'errors' in result.error) {
  result.error.errors.at(0)?.path;
}
