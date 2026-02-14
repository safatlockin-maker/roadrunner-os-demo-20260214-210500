import Layout from '../components/layout/Layout';

export default function Pipeline() {
  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Sales Pipeline</h1>
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          <p className="text-lg">Kanban pipeline view coming soon...</p>
          <p className="text-sm mt-2">Drag-and-drop leads between stages!</p>
        </div>
      </div>
    </Layout>
  );
}
