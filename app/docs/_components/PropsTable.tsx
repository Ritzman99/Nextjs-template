import type { PropRow } from '../registry';
import styles from '../docs.module.scss';

interface PropsTableProps {
  rows: PropRow[];
}

export function PropsTable({ rows }: PropsTableProps) {
  if (rows.length === 0) return null;
  return (
    <div className={styles.tableWrap}>
      <table className={styles.propsTable}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <td>
                <code className={styles.propName}>{row.name}</code>
              </td>
              <td>
                <code className={styles.propType}>{row.type}</code>
              </td>
              <td>{row.default}</td>
              <td>{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
