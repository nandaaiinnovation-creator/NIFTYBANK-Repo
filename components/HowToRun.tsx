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
                This guide provides instructions on how to set up and run this application end-to-end, including both the frontend and the new backend server.
            </p>
            
            <div className="space-y-8">
                <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center"><i className="fa-solid fa-desktop mr-3 text-cyan-400"></i>Part 1: Running the Frontend</h3>
                    <p className="text-gray-400 mb-4">First, set up the user interface. You will need Node.js and npm (or yarn/pnpm) installed.</p>
                    <ol className="list-decimal list-inside text-gray-400 space-y-4">
                        <li>
                            <span className="font-semibold text-gray-300">Clone the repository (if you haven't already):</span>
                            <CodeBlock>{`git clone <repository-url>\ncd <repository-directory>`}</CodeBlock>
                        </li>
                        <li>
                            <span className="font-semibold text-gray-300">Install dependencies:</span> This command reads `package.json` and installs all necessary libraries for the frontend.
                             <CodeBlock>{`npm install`}</CodeBlock>
                        </li>
                        <li>
                            <span className="font-semibold text-gray-300">Run the development server:</span> This will start the React application on a local server (usually `http://localhost:3000`).
                             <CodeBlock>{`npm start`}</CodeBlock>
                        </li>
                         <li className="text-sm">
                            <i className="fa-solid fa-circle-info mr-2 text-yellow-400"></i> The app will open in your browser. At this point, it will try to connect to the backend and fail, which is expected. Proceed to Part 2.
                        </li>
                    </ol>
                </div>
                
                 <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center"><i className="fa-solid fa-server mr-3 text-cyan-400"></i>Part 2: Running the Backend</h3>
                    <p className="text-gray-400 mb-4">Next, set up and run the Node.js backend server, which provides the live data.</p>
                     <ol className="list-decimal list-inside text-gray-400 space-y-4">
                        <li>
                           <span className="font-semibold text-gray-300">Create a backend folder:</span> Inside your main project directory, create a new folder named `backend`.
                           <CodeBlock>{`mkdir backend\ncd backend`}</CodeBlock>
                        </li>
                        <li>
                            <span className="font-semibold text-gray-300">Initialize a new Node.js project:</span>
                            <CodeBlock>{`npm init -y`}</CodeBlock>
                        </li>
                        <li>
                           <span className="font-semibold text-gray-300">Install backend dependencies:</span>
                           <CodeBlock>{`npm install express ws cors`}</CodeBlock>
                        </li>
                        <li>
                            <span className="font-semibold text-gray-300">Create the server files:</span> Inside the `backend` folder, create the `server.js` and `PriceActionEngine.js` files with the code provided in the "Backend Implementation" section.
                        </li>
                        <li>
                            <span className="font-semibold text-gray-300">Start the backend server:</span> Open a <span className="font-bold">new, separate terminal window</span>, navigate to the `backend` directory, and run:
                            <CodeBlock>{`node server.js`}</CodeBlock>
                            <p className="text-sm">You should see the message "Server listening on port 8080".</p>
                        </li>
                         <li className="text-sm">
                            <i className="fa-solid fa-circle-check mr-2 text-green-400"></i> With both the frontend and backend running, refresh the application in your browser. It should now connect successfully, and you will see live signals being generated in the "Live Signals" section.
                        </li>
                    </ol>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center"><i className="fa-brands fa-github mr-3 text-cyan-400"></i>Version Control with GitHub</h3>
                    <p className="text-gray-400 mb-4">To save your work and collaborate, use Git and host your repository on GitHub.</p>
                     <ol className="list-decimal list-inside text-gray-400 space-y-4">
                        <li>
                            <span className="font-semibold text-gray-300">Stage and Commit your changes:</span>
                             <CodeBlock>{`# From the root project directory\ngit add .\ngit commit -m "feat: Implement full backend and connect frontend"`}</CodeBlock>
                        </li>
                        <li>
                            <span className="font-semibold text-gray-300">Push to GitHub:</span>
                             <CodeBlock>{`git push origin main`}</CodeBlock>
                        </li>
                    </ol>
                </div>

            </div>
        </SectionCard>
    );
};

export default HowToRun;