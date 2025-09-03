
import React from 'react';
import SectionCard from './SectionCard';

const CodeBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <pre className="bg-gray-900 p-4 rounded-md text-sm text-cyan-300 font-mono overflow-x-auto">
        <code>{children}</code>
    </pre>
);

const HowToRun: React.FC = () => {
    return (
        <SectionCard title="How to Run This Application" iconClass="fa-solid fa-terminal">
            <p className="text-gray-400 mb-6">
                This application has a separate frontend (this user interface) and backend (the trading engine). Follow these steps to run the complete system on your local machine.
            </p>
            
            <div className="space-y-8">
                <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center"><i className="fa-solid fa-download mr-3 text-cyan-400"></i>Step 1: Install All Dependencies</h3>
                    <p className="text-gray-400 mb-4">You need to install the required libraries for both the frontend and backend. You only need to do this once.</p>
                    <ol className="list-decimal list-inside text-gray-400 space-y-4">
                        <li>
                            <span className="font-semibold text-gray-300">Install Frontend Dependencies:</span> From the project's root directory, run:
                             <CodeBlock>{`npm install`}</CodeBlock>
                        </li>
                        <li>
                            <span className="font-semibold text-gray-300">Install Backend Dependencies:</span> Navigate into the backend directory and run its install command.
                             <CodeBlock>{`cd backend\nnpm install`}</CodeBlock>
                        </li>
                    </ol>
                </div>
                
                 <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center"><i className="fa-solid fa-power-off mr-3 text-cyan-400"></i>Step 2: Run The Application</h3>
                    <p className="text-gray-400 mb-4">You must have two separate terminal windows open to run both parts of the application simultaneously.</p>
                     <ol className="list-decimal list-inside text-gray-400 space-y-4">
                        <li>
                           <span className="font-semibold text-gray-300">Terminal 1: Start the Backend Server.</span> Navigate to the `backend` directory and start the server.
                           <CodeBlock>{`cd backend\nnode server.js`}</CodeBlock>
                           <p className="text-sm">Leave this terminal running. You should see "Server listening on port 8080".</p>
                        </li>
                        <li>
                            <span className="font-semibold text-gray-300">Terminal 2: Start the Frontend UI.</span> In a new terminal, navigate to the project's root directory and run:
                            <CodeBlock>{`# Make sure you are in the root folder, not the backend folder\nnpm start`}</CodeBlock>
                        </li>
                         <li className="text-sm">
                            <i className="fa-solid fa-circle-check mr-2 text-green-400"></i> Your browser will open to `http://localhost:3000`. The application is now fully operational and connected.
                        </li>
                    </ol>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center"><i className="fa-brands fa-docker mr-3 text-cyan-400"></i>Alternative: Run with Docker</h3>
                    <p className="text-gray-400 mb-4">If you have Docker Desktop installed, you can launch the entire application (frontend, backend, and database) with a single command from the project root.</p>
                     <CodeBlock>{`docker-compose up --build`}</CodeBlock>
                     <p className="text-sm text-gray-400 mt-2">The app will be available at <code className="bg-gray-700 px-1 rounded-sm">http://localhost</code>.</p>
                </div>

            </div>
        </SectionCard>
    );
};

export default HowToRun;
